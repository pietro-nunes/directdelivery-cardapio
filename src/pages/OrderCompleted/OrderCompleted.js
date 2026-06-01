import React, { useState } from "react";
import "./OrderCompleted.css";
import Lottie from "lottie-react";
import loadingAnimation from "../../lottie/completed.json";
import { FaWhatsapp } from "react-icons/fa";
import { MdNotificationsActive, MdNotificationsNone } from "react-icons/md";
import { formatarNumero } from "../../utils/functions";
import { useNavigate } from "react-router-dom";
import config from "../../config";
import Cookies from "js-cookie";

const OrderCompleted = ({
  tenantData,
  orderDetails,
  sendWhatsApp,
  isTableMode,
  basePath,
}) => {
  const navigate = useNavigate();
  const [notifActivated, setNotifActivated] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState(false);
  const [notifDenied, setNotifDenied] = useState(false);

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isSupported = 'Notification' in window && 'serviceWorker' in navigator;

  const handleActivateNotifications = async () => {
    setNotifLoading(true);
    setNotifError(false);
    setNotifDenied(false);

    try {
      if (!isSupported) {
        setNotifError(true);
        return;
      }

      const raw = Cookies.get(`token-${tenantData.slug}`);
      if (!raw) { setNotifError(true); return; }
      const { id: customerId } = JSON.parse(raw);

      if (!window.OneSignalDeferred) {
        setNotifError(true);
        return;
      }

      await new Promise((resolve) => {
        window.OneSignalDeferred.push(async (OneSignal) => {
          try {
            await OneSignal.init({
              appId: '8c53382a-5120-4d84-9748-be4f220b2694',
            });

            const perm = await OneSignal.Notifications.requestPermission(true);

            if (perm) {
              const playerId = OneSignal.User.PushSubscription.id;
              if (playerId) {
                await fetch(`${config.baseURL}/notifications/register`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ customerId, playerId }),
                });
                setNotifActivated(true);
                resolve(true);
                return;
              }
            }

            if (Notification.permission === 'denied') {
              setNotifDenied(true);
            } else {
              setNotifError(true);
            }
            resolve(false);
          } catch {
            setNotifError(true);
            resolve(false);
          }
        });
      });
    } catch {
      setNotifError(true);
    } finally {
      setNotifLoading(false);
    }
  };

  const formatWhatsAppMessage = (orderDetails) => {
    const {
      id,
      createdAt,
      total,
      items,
      itens,
      address,
      endereco,
      withdraw,
      nomeFormaPagamento,
      paymentMethod,
      change,
      troco,
      observation,
      observacaoPedido,
    } = orderDetails ?? {};

    // helper: parse "4.00" | "4,00" | 4 -> Number
    const toNumber = (v) => {
      if (v == null || v === "") return null;
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        const n = parseFloat(v.replace(",", "."));
        return Number.isFinite(n) ? n : null;
      }
      return null;
    };

    // 1) Itens normalizados
    const rawItems = Array.isArray(items)
      ? items
      : Array.isArray(itens)
        ? itens
        : [];
    const normalizedItems = rawItems.map((it) => ({
      quantity: it.quantity ?? it.count ?? 1,
      productName: it.productName ?? it.name ?? "Item",
      price: Number(it.totalPrice ?? it.productPrice ?? it.price ?? 0),
      isActive: it.isActive ?? true,
      relations: Array.isArray(it.relations) ? it.relations : [],
    }));

    // 2) Endereço normalizado
    let addr = address ?? endereco ?? null;
    if (typeof addr === "string") {
      try {
        addr = JSON.parse(addr);
      } catch {
        addr = null;
      }
    }
    const hasAddress =
      addr &&
      typeof addr === "object" &&
      Object.values(addr).some(
        (v) => v !== undefined && v !== null && String(v).trim() !== ""
      );

    // >>> NOVO: captura delivery fee em possíveis lugares
    const deliveryFeeVal =
      toNumber(addr?.deliveryFee ?? addr?.delivery_fee ?? addr?.taxaEntrega) ??
      toNumber(addr?.neighborhood?.deliveryFee) ??
      toNumber(addr?.city?.deliveryFee);

    // 3) Observação
    const obs = observation ?? observacaoPedido;

    // 4) Mensagem
    let message = `*Novo Pedido #${id ?? "—"} Realizado!*\n\n`;
    // (se quiser manter a linha separada, descomente)
    // if (id !== undefined) message += `📌 *Número do Pedido:* ${id}\n`;
    message += `📅 *Data:* ${createdAt
        ? new Date(createdAt).toLocaleString()
        : new Date().toLocaleString()
      }\n\n`;

    message += `🍽️ *Itens do Pedido:*\n`;
    normalizedItems.forEach((item) => {
      message += `- ${item.quantity}x ${item.productName} - R$ ${formatarNumero(
        item.price
      )}\n`;

      // Adiciona as relações (composition, additional, flavor)
      if (item.relations && item.relations.length > 0) {
        item.relations.forEach((rel) => {
          const relProduct = rel.relatedProduct;
          if (relProduct && relProduct.name) {
            const relType = rel.type || "";
            const relQuantity = rel.quantity || 1;
            const relPrice = Number(rel.price || 0);
            const isRemoved = rel.removed === true;

            if (relType === "composition") {
              // Compositions são sempre removidas (Sem)
              message += `    → Sem ${relProduct.name}\n`;
            } else if (relType === "additional") {
              message += `    → Adicional: ${relQuantity}x ${relProduct.name}`;
              if (relPrice > 0) {
                message += ` (+R$ ${formatarNumero(relPrice)})`;
              }
              message += `\n`;
            } else if (relType === "flavor") {
              message += `    → Sabor: ${relProduct.name}\n`;
            }
          }
        });
      }
    });

    // 5) Entrega x Retirada
    if (withdraw === true) {
      message += `\n🛍️ *Retirada no balcão.*\n`;
    } else if (hasAddress) {
      const apelido =
        addr.apelido ?? addr.apelidoEndereco ?? addr.nickname ?? "";
      const enderecoStr = addr.endereco ?? addr.address ?? "";
      const numero = addr.numero ?? addr.number ?? "";
      const complemento = addr.complemento ?? addr.complement ?? "";
      const bairro =
        addr.bairro ?? addr.neighborhood?.name ?? addr.neighborhood ?? "";
      const cidade = addr.cidade ?? addr.city?.name ?? addr.city ?? "";
      const cep = addr.cep ?? addr.zipcode ?? addr.zip ?? "";

      message += `\n📍 *Endereço de Entrega:*\n`;
      if (apelido) message += `${apelido}: `;
      message += `${enderecoStr}${numero ? `, ${numero}` : ""}${complemento ? ` - ${complemento}` : ""
        }\n`;
      message += `${bairro}${bairro && (cidade || cep) ? " - " : ""}${cidade}${cep ? `, CEP: ${cep}` : ""
        }\n`;
      if (addr.pontoReferencia ?? addr.ptReferencia ?? addr.referencePoint) {
        message += `Ponto de Referência: ${addr.pontoReferencia ?? addr.ptReferencia ?? addr.referencePoint
          }\n`;
      }

      // >>> NOVO: mostra a taxa de entrega, se houver
      if (deliveryFeeVal != null) {
        message += `🚚 *Taxa de Entrega:* R$ ${formatarNumero(
          deliveryFeeVal
        )}\n`;
      }
    }

    // 6) Observações
    if (obs) {
      message += `\n📝 *Observações do Pedido:* ${obs}\n`;
    }

    // 7) Pagamento
    const trocoVal = change ?? troco;
    message += `\n💳 *Forma de Pagamento:* ${nomeFormaPagamento ?? `#${paymentMethod ?? "—"}`
      }`;
    if (trocoVal != null && trocoVal !== "") {
      message += ` (Troco para R$ ${formatarNumero(trocoVal)})`;
    }

    // 8) Total
    if (total != null) {
      message += `\n🛒 *Total do Pedido:* R$ ${formatarNumero(total)}\n`;
    }

    return message;
  };

  // Constante com a mensagem formatada
  const message = formatWhatsAppMessage(orderDetails);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const shareUrl = isMobile
    ? `https://api.whatsapp.com/send?phone=55${tenantData.phone
    }&text=${encodeURIComponent(message)}`
    : `https://web.whatsapp.com/send?phone=55${tenantData.phone
    }&text=${encodeURIComponent(message)}`;

  const handleShare = () => {
    // Abre a URL em uma nova aba
    window.open(shareUrl, "_blank");
  };

  return (
    <div className="order-completed">
      <h2>Pedido Finalizado</h2>
      <Lottie
        animationData={loadingAnimation}
        loop={true}
        style={{ width: 200, height: 200 }}
      />
      <div className="order-summary">
        <p>
          <strong>Nº do Pedido: </strong> #{orderDetails.id}
        </p>
        <p>
          <strong>Data:</strong> {new Date().toLocaleString()}
        </p>
        <p>
          <strong>Total: </strong> R$ {formatarNumero(orderDetails.total)}
        </p>
      </div>
      {!isTableMode && !notifActivated && (
        <>
          {isIOS && !isSupported ? (
            <div className="notif-ios-guide">
              <MdNotificationsNone size={20} />
              <span>
                No iPhone, adicione esta página à <strong>Tela de Início</strong> (compartilhar → "Adicionar à Tela de Início") e depois abra o app por lá para ativar notificações.
              </span>
            </div>
          ) : (
            <button
              className="btn-notification"
              onClick={handleActivateNotifications}
              disabled={notifLoading}
            >
              <MdNotificationsNone size={20} />
              {notifLoading ? 'Ativando...' : 'Ativar notificações do pedido'}
            </button>
          )}
        </>
      )}
      {notifActivated && (
        <div className="notif-activated">
          <MdNotificationsActive size={20} />
          <span>Notificações ativadas! Você receberá atualizações do pedido.</span>
        </div>
      )}
      {notifError && !notifDenied && (
        <p className="notif-error">
          {isIOS
            ? 'No iPhone, as notificações funcionam após adicionar à Tela de Início (compartilhar → "Adicionar à Tela de Início").'
            : 'Não foi possível ativar. Verifique as permissões do navegador.'}
        </p>
      )}
      {notifDenied && (
        <p className="notif-error">
          {isIOS
            ? 'No iPhone, as notificações funcionam apenas após adicionar à Tela de Início. Compartilhe → "Adicionar à Tela de Início".'
            : 'Permissão negada. Ative as notificações nas configurações do navegador e tente novamente.'}
        </p>
      )}
      {!isSupported && !isIOS && (
        <p className="notif-error">
          Seu navegador não suporta notificações. Tente usar Chrome ou Edge.
        </p>
      )}
      <div className="action-buttons">
        {!isTableMode ? (
          <>
            <button
              className="btn-secondary"
              onClick={() => navigate(`/${tenantData.slug}/orders`)}
            >
              Acompanhar Pedido
            </button>
            <button
              className="btn-primary"
              onClick={sendWhatsApp ? handleShare : null}
            >
              <FaWhatsapp size={20} /> Enviar pelo WhatsApp (Opcional)
            </button>
          </>
        ) : (
          <>
            <button
              className="btn-secondary"
              onClick={() => navigate(`${basePath}`)}
            >
              Voltar ao cardápio
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderCompleted;
