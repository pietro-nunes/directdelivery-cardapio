import "./OrdersList.css";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useFetchWithLoading } from "../../contexts/fetchWithLoading";
import config from "../../config";
import Cookies from "js-cookie";
import { FiRefreshCw, FiAlertCircle, FiCopy } from "react-icons/fi";
import { MdOutlineCheck, MdLocationPin } from "react-icons/md";
import { formatarNumero, formatDateUTC, toTitleCase } from "../../utils/functions";

const OrdersList = ({ tenantData }) => {
  const [orders, setOrders] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [copiedMap, setCopiedMap] = useState({});
  const { fetchWithLoading } = useFetchWithLoading();

  const statusSteps = ["accepted", "preparing", "enroute", "delivered"];
  const statusTranslations = {
    created: "Criado",
    accepted: "Aceito",
    preparing: "Em preparo",
    enroute: "Em rota",
    delivered: "Entregue",
    ready: "Pronto para Retirada",
    canceled: "Cancelado",
  };

  const getCustomerId = () => {
    const token = Cookies.get("token");
    if (token) {
      const parsedToken = JSON.parse(token);
      return parsedToken.id;
    }
    return null;
  };

  const currentTenantId = tenantData?.id;

  const fetchOrders = useCallback(async () => {
    const customerId = getCustomerId();
    if (!customerId || !currentTenantId) {
      console.error("Erro: customerId ou tenantId não encontrado.");
      return;
    }

    try {
      const ordersResponse = await fetchWithLoading(
        `${config.baseURL}/orders/${customerId}/${currentTenantId}`
      );
      const ordersData = await ordersResponse.json();
      setOrders(ordersData);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    }
  }, [fetchWithLoading, currentTenantId]);

  const initialFetchDone = useRef(false);

  useEffect(() => {
    // Fetch inicial apenas quando houver tenant
    if (currentTenantId && !initialFetchDone.current) {
      fetchOrders();
      initialFetchDone.current = true;
    }

    // Timer regressivo + refetch a cada 60s
    const countdownInterval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          if (currentTenantId) {
            fetchOrders();
          }
          return 60;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [fetchOrders, currentTenantId]);

  const getStatusIndex = (status) => {
    return statusSteps.indexOf(status);
  };

  const handleCopyQrCode = async (order) => {
    try {
      const code = order?.payment?.qrCode;
      if (!code) return;
      await navigator.clipboard.writeText(code);
      setCopiedMap((m) => ({ ...m, [order.id]: true }));
      setTimeout(() => {
        setCopiedMap((m) => ({ ...m, [order.id]: false }));
      }, 2000);
    } catch (e) {
      console.error("Falha ao copiar o código Pix:", e);
    }
  };

  return (
    <div className="orders-list">
      <h2 className="orders-title">Meus Pedidos</h2>
      <p className="update-timer">
        <FiRefreshCw /> Atualizando em: {timeLeft}s
      </p>

      {orders.length > 0 ? (
        orders.map((order) => {
          const paymentStatus = String(order?.payment?.status || "").toLowerCase();

          const isOnlinePaid =
            !!order?.onlinePayment &&
            !!order?.payment &&
            (paymentStatus === "paid" || paymentStatus === "credited");

          const isOnlineExpired =
            !!order?.onlinePayment &&
            !!order?.payment &&
            paymentStatus === "expired";

          const isOnlineCreated =
            !!order?.onlinePayment &&
            !!order?.payment &&
            paymentStatus === "created";

          return (
            <div key={order.id} className="order-card">
              <h3>Pedido #{order.id}</h3>
              <p>Data: {formatDateUTC(order.createdAt)}</p>

              {/* Endereço de entrega */}
              {order.address && (
                <div className="order-address-section">
                  <h4>Endereço de Entrega:</h4>
                  <p>
                    {order.address.address}
                    {order.address.complement && `, ${order.address.complement}`}
                  </p>
                  <p>
                    {order.address.bairro}, {order.address.cidade} - CEP: {order.address.cep}
                  </p>
                </div>
              )}

              {/* Local de retirada */}
              {!order.address && (
                <div className="order-address-section">
                  <h4>Retirada no Local:</h4>
                  <p>
                    <span>
                      <MdLocationPin size={14} />
                      {tenantData.address &&
                        tenantData.address !== "0" &&
                        `${toTitleCase(tenantData.address)}, `}
                      {tenantData.number &&
                        tenantData.number !== "0" &&
                        `${tenantData.number}, `}
                      {tenantData.neighborhood &&
                        tenantData.neighborhood !== "0" &&
                        `${toTitleCase(tenantData.neighborhood)} - `}
                      {tenantData.city && tenantData.city !== "0" && toTitleCase(tenantData.city)}
                    </span>
                  </p>
                </div>
              )}

              {/* Detalhamento do Total */}
              <div className="order-total-breakdown">
                <div className="order-subtotal">
                  <span>Subtotal dos itens:</span>
                  <span>R$ {formatarNumero(order.total - (order.address?.deliveryFee || 0))}</span>
                </div>
                {order.address?.deliveryFee > 0 && (
                  <div className="order-delivery-fee">
                    <span>Taxa de entrega:</span>
                    <span>R$ {formatarNumero(order.address.deliveryFee)}</span>
                  </div>
                )}
                <div className="order-total-final">
                  <span>Total:</span>
                  <span>R$ {formatarNumero(order.total)}</span>
                </div>
              </div>

              {/* Observação do pedido */}
              {order.observation && (
                <p className="order-observation">
                  <strong>Observação:</strong> {order.observation}
                </p>
              )}

              {/* AVISO: Pagamento online aprovado */}
              {isOnlinePaid && (
                <div className="order-payment-paid">
                  <p className="paid-text">
                    <MdOutlineCheck size={20} className="paid-check-icon" />
                    Pagamento online aprovado
                    {order?.payment?.method
                      ? ` (${order.payment.method.toUpperCase()})`
                      : ""}{" "}
                    no valor de R$ {formatarNumero(order.payment.amount)}.
                  </p>
                  <p className="paid-subtext">
                    TxID: {order?.payment?.txid}{" "}
                    {order?.payment?.provider
                      ? `• Provedor: ${order.payment.provider.toUpperCase()}`
                      : ""}
                  </p>
                </div>
              )}

              {/* AVISO: Pagamento online expirado */}
              {!isOnlinePaid && isOnlineExpired && (
                <div className="order-payment-expired">
                  <p className="expired-text">
                    <FiAlertCircle size={18} className="expired-icon" />
                    Pagamento online expirado.
                  </p>
                  {order?.payment?.txid && (
                    <p className="expired-subtext">TxID: {order.payment.txid}</p>
                  )}
                </div>
              )}

              {/* Aguardando pagamento (created) → Ver/ Copiar QR novamente */}
              {!isOnlinePaid && !isOnlineExpired && isOnlineCreated && (
                <div className="order-payment-awaiting">
                  <p className="awaiting-text">
                    <FiAlertCircle size={18} className="awaiting-icon" />
                    Aguardando pagamento online. Você pode copiar o código Pix novamente abaixo.
                  </p>

                  {order?.payment?.qrCodeImage && (
                    <div className="order-qr-thumb-wrap">
                      <img
                        className="order-qr-thumb"
                        src={order.payment.qrCodeImage}
                        alt={`QR Code do pedido #${order.id}`}
                      />
                    </div>
                  )}

                  <button
                    className="order-btn-copy"
                    onClick={() => handleCopyQrCode(order)}
                  >
                    <FiCopy size={18} />
                    Copiar código Pix
                  </button>

                  {copiedMap[order.id] && (
                    <div className="order-copied-hint">✓ Código copiado!</div>
                  )}
                </div>
              )}

              {/* Itens */}
              <div className="order-items">
                <h4>Itens:</h4>
                {order.items.map((item) => (
                  <div key={item.id} className="order-item">
                    <span>
                      {item.quantity}x {item.productName}
                    </span>
                    <span>R$ {formatarNumero(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              {/* Status visual */}
              <div
                className={`order-status ${
                  order.status === "canceled" || order.status === "ready"
                    ? "status-hidden-line"
                    : ""
                }`}
              >
                {order.status === "canceled" ? (
                  <div className="status-canceled">
                    <p className="canceled-text">Pedido Cancelado</p>
                    {order.cancel_observation && (
                      <p className="canceled-observation">
                        <strong>Motivo:</strong> {order.cancel_observation}
                      </p>
                    )}
                  </div>
                ) : order.status === "ready" ? (
                  <div className="status-ready">
                    <p className="ready-text">
                      <MdOutlineCheck size={24} className="ready-check-icon" />
                      Seu pedido está pronto para retirada na loja!
                    </p>
                  </div>
                ) : (
                  statusSteps.map((status, index) => {
                    const currentStatusIndex = getStatusIndex(order.status);
                    const isActive = index <= currentStatusIndex;
                    return (
                      <div
                        key={status}
                        className={`status-step ${isActive ? "active" : ""}`}
                      >
                        <div className="status-icon">
                          {isActive ? <MdOutlineCheck size={20} /> : ""}
                        </div>
                        <span>{statusTranslations[status]}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })
      ) : (
        <p>Nenhum pedido encontrado.</p>
      )}
    </div>
  );
};

export default OrdersList;
