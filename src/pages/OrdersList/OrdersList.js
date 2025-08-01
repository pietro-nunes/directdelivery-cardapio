import "./OrdersList.css";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useFetchWithLoading } from "../../contexts/fetchWithLoading";
import config from "../../config";
import Cookies from "js-cookie";
import { FiRefreshCw } from "react-icons/fi";
import { formatarNumero } from "../../utils/functions";
import { MdOutlineCheck } from "react-icons/md";

const OrdersList = ({ tenantData }) => {
  const [orders, setOrders] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
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
    // Realiza o fetch inicial SOMENTE se currentTenantId estiver disponível
    // e o fetch inicial ainda não tiver sido feito.
    if (currentTenantId && !initialFetchDone.current) {
      fetchOrders();
      initialFetchDone.current = true; // Marca que o fetch inicial foi realizado
    }

    // Configura o contador regressivo para atualização e aciona o fetch quando o timer zerar.
    const countdownInterval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) { // Quando o tempo chega a 0 ou menos (garante que não passe de 0)
          if (currentTenantId) { // Garante que currentTenantId existe antes de buscar
            fetchOrders(); // Busca os pedidos
          }
          return 60; // Reseta o contador para 60
        }
        return prevTime - 1; // Decrementa o contador
      });
    }, 1000);

    // Função de limpeza para desativar o intervalo quando o componente é desmontado
    return () => {
      clearInterval(countdownInterval);
    };
  }, [fetchOrders, currentTenantId]); // As dependências garantem que o efeito re-execute se essas funções/valores mudarem.

  const getStatusIndex = (status) => {
    return statusSteps.indexOf(status);
  };

  return (
    <div className="orders-list">
      <h2 className="orders-title">Seus Pedidos</h2>
      <p className="update-timer">
        <FiRefreshCw /> Atualizando em: {timeLeft}s
      </p>
      {orders.length > 0 ? (
        orders.map((order) => (
          <div key={order.id} className="order-card">
            <h3>Pedido #{order.id}</h3>
            <p>Data: {new Date(order.createdAt).toLocaleString()}</p>
            <p>Total: R$ {formatarNumero(order.total)}</p>
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
            <div className={`order-status ${order.status === "canceled" || order.status === "ready" ? "status-hidden-line" : ""}`}>
              {order.status === "canceled" ? (
                <div className="status-canceled">
                  <p className="canceled-text">Pedido Cancelado</p>
                  {order.observation && (
                    <p className="canceled-observation">
                      **Motivo:** {order.observation}
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
        ))
      ) : (
        <p>Nenhum pedido encontrado.</p>
      )}
    </div>
  );
};

export default OrdersList;