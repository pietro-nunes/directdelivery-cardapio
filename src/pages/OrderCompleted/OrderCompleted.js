import React from "react";
import "./OrderCompleted.css";
import Lottie from "lottie-react";
import loadingAnimation from "../../lottie/completed.json"; // Substitua pelo seu arquivo Lottie
import { FaWhatsapp } from "react-icons/fa";
import { formatarNumero } from "../../utils/functions";
import { useNavigate } from "react-router-dom";

const OrderCompleted = ({ tenantData, orderDetails, sendWhatsApp }) => {
  const navigate = useNavigate();

  const formatWhatsAppMessage = (orderDetails) => {
    const { id, createdAt, total, items, address, paymentMethod, change } =
      orderDetails;

    const formasPagamentoFake = [
      { id: "1", nome: "Cartão de Crédito/Débito" },
      { id: "3", nome: "Pix" },
      { id: "4", nome: "Dinheiro na Entrega" },
    ];

    // Encontra o nome do método de pagamento com base no ID
    const payment = formasPagamentoFake.find(
      (forma) => forma.id === paymentMethod
    );
    const paymentName = payment
      ? payment.nome
      : "Método de Pagamento Não Especificado";

    let message = `*Novo Pedido Realizado!*\n\n`;
    message += `📌 *Número do Pedido:* ${id}\n`;
    message += `📅 *Data:* ${new Date(createdAt).toLocaleString()}\n\n`;

    message += `🍽️ *Itens do Pedido:*\n`;
    items.forEach((item) => {
      message += `- ${item.quantity}x ${item.productName} - R$ ${formatarNumero(
        item.totalPrice
      )}\n`;
      if (item.observation) {
        message += `   Observação: ${item.observation}\n`;
      }
      if (item.relations?.length > 0) {
        const flavors = item.relations.filter((rel) => rel.type === "flavor");
        const additionals = item.relations.filter(
          (rel) => rel.type === "additional"
        );
        const compositions = item.relations.filter(
          (rel) => rel.type === "composition"
        );

        if (flavors.length > 0) {
          message += `   Sabores:\n`;
          flavors.forEach((flavor) => {
            message += `      - ${flavor.relatedProduct.name}${
              flavor.price > 0 ? ` (+R$ ${formatarNumero(flavor.price)})` : ""
            }\n`;
          });
        }

        if (additionals.length > 0) {
          message += `   Adicionais:\n`;
          additionals.forEach((add) => {
            message += `      - ${add.relatedProduct.name}${
              add.price > 0 ? ` (+R$ ${formatarNumero(add.price)})` : ""
            }\n`;
          });
        }

        if (compositions.length > 0) {
          message += `   Composições Removidas:\n`;
          compositions.forEach((composition) => {
            message += `      - ${composition.relatedProduct.name}${
              composition.price > 0
                ? ` (+R$ ${formatarNumero(composition.price)})`
                : ""
            }\n`;
          });
        }
      }
    });

    message += `\n📍 *Endereço de Entrega:*\n`;
    message += `${address.apelido}: ${address.endereco}, ${address.numero} ${
      address.complemento ? `- ${address.complemento}` : ""
    }\n`;
    message += `${address.bairro} - ${address.cidade}, CEP: ${address.cep}\n`;
    if (address.pontoReferencia) {
      message += `Ponto de Referência: ${address.pontoReferencia}\n`;
    }

    message += `\n💳 *Forma de Pagamento:* ${paymentName}`;
    if (paymentMethod === "4") {
      message += ` (Troco para R$ ${change})`;
    }
    message += `\n🛒 *Total do Pedido:* R$ ${formatarNumero(total)}\n`;

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
          <strong>Pedido:</strong> {orderDetails.id}
        </p>
        <p>
          <strong>Data:</strong>{" "}
          {new Date(orderDetails.createdAt).toLocaleString()}
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
