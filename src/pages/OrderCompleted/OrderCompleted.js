import React from "react";
import "./OrderCompleted.css";
import Lottie from "lottie-react";
import loadingAnimation from "../../lottie/completed.json"; // Substitua pelo seu arquivo Lottie
import { FaWhatsapp } from "react-icons/fa";
import { formatarNumero } from "../../utils/functions";
import { useNavigate } from "react-router-dom";

const OrderCompleted = ({
  tenantData,
  orderDetails,
  sendWhatsApp,
  isTableMode,
  basePath,
}) => {
  const navigate = useNavigate();

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
      price: Number(it.productPrice ?? it.price ?? it.totalPrice ?? 0),
      isActive: it.isActive ?? true,
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
    message += `📅 *Data:* ${
      createdAt
        ? new Date(createdAt).toLocaleString()
        : new Date().toLocaleString()
    }\n\n`;

    message += `🍽️ *Itens do Pedido:*\n`;
    normalizedItems.forEach((item) => {
      message += `- ${item.quantity}x ${item.productName} - R$ ${formatarNumero(
        item.price
      )}\n`;
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
      message += `${enderecoStr}${numero ? `, ${numero}` : ""}${
        complemento ? ` - ${complemento}` : ""
      }\n`;
      message += `${bairro}${bairro && (cidade || cep) ? " - " : ""}${cidade}${
        cep ? `, CEP: ${cep}` : ""
      }\n`;
      if (addr.pontoReferencia ?? addr.ptReferencia ?? addr.referencePoint) {
        message += `Ponto de Referência: ${
          addr.pontoReferencia ?? addr.ptReferencia ?? addr.referencePoint
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
    message += `\n💳 *Forma de Pagamento:* ${
      nomeFormaPagamento ?? `#${paymentMethod ?? "—"}`
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
    ? `https://api.whatsapp.com/send?phone=55${
        tenantData.phone
      }&text=${encodeURIComponent(message)}`
    : `https://web.whatsapp.com/send?phone=55${
        tenantData.phone
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
          <strong>Data:</strong> {new Date().toLocaleString()}
        </p>
        <p>
          <strong>Total: </strong> R$ {formatarNumero(orderDetails.total)}
        </p>
      </div>
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
