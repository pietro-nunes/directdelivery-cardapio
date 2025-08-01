import React from "react";
import "./OrderCompleted.css";
import Lottie from "lottie-react";
import loadingAnimation from "../../lottie/completed.json"; // Substitua pelo seu arquivo Lottie
import { FaWhatsapp } from "react-icons/fa";
import { formatarNumero } from "../../utils/functions";
import { useNavigate } from "react-router-dom";

const OrderCompleted = ({ tenantData, orderDetails, sendWhatsApp }) => {
  console.log(orderDetails);

  const navigate = useNavigate();

  const formatWhatsAppMessage = (orderDetails) => {
    const {
      id,
      createdAt,
      total,
      itens,
      endereco,
      retirada,
      nomeFormaPagamento,
      troco,
      observacaoPedido,
    } = orderDetails ?? {};

    // 1) Normaliza itens
    const normalizedItems = (Array.isArray(itens) ? itens : []).map((it) => {
      return {
        quantity: it.quantity ?? it.quantidade ?? 1,
        productName: it.name ?? it.productName ?? "Item",
        price: Number(it.price ?? 0),
        isActive: it.isActive ?? true,
      };
    });

    // 2) Normaliza endereço (string "{}" ou objeto)
    let addr = endereco ?? null;
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

    // 3) Monta mensagem
    let message = `*Novo Pedido Realizado!*\n\n`;
    if (id !== undefined) message += `📌 *Número do Pedido:* ${id}\n`;
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

    // 4) Endereço ou retirada
    if (retirada === true) {
      message += `\n🛍️ *Retirada no balcão.*\n`;
    } else if (hasAddress) {
      const apelido = addr.apelido ?? "";
      const enderecoStr = addr.endereco ?? "";
      const numero = addr.numero ?? "";
      const complemento = addr.complemento ?? "";
      const bairro = addr.bairro ?? "";
      const cidade = addr.cidade ?? "";
      const cep = addr.cep ?? "";

      message += `\n📍 *Endereço de Entrega:*\n`;
      if (apelido) message += `${apelido}: `;
      message += `${enderecoStr}${numero ? `, ${numero}` : ""}${
        complemento ? ` - ${complemento}` : ""
      }\n`;
      message += `${bairro}${bairro && (cidade || cep) ? " - " : ""}${cidade}${
        cep ? `, CEP: ${cep}` : ""
      }\n`;
      if (addr.pontoReferencia) {
        message += `Ponto de Referência: ${addr.pontoReferencia}\n`;
      }
    }

    // 5) Observação do pedido
    if (observacaoPedido) {
      message += `\n📝 *Observações do Pedido:* ${observacaoPedido}\n`;
    }

    // 6) Forma de pagamento (vem direto do JSON)
    message += `\n💳 *Forma de Pagamento:* ${nomeFormaPagamento ?? ""}`;
    if (troco != null && troco !== "") {
      message += ` (Troco para R$ ${formatarNumero(troco)})`;
    }

    // 7) Total
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
          <strong>Data:</strong>{" "}
          {new Date().toLocaleString()}
        </p>
        <p>
          <strong>Total: </strong> R$ {formatarNumero(orderDetails.total)}
        </p>
      </div>
      <div className="action-buttons">
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
      </div>
    </div>
  );
};

export default OrderCompleted;
