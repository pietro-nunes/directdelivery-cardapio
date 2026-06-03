import React from "react";
import "./OrderCompleted.css";
import Lottie from "lottie-react";
import loadingAnimation from "../../lottie/completed.json";
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

  const message = `Gostaria de acompanhar o pedido #${orderDetails?.id ?? ""} pelo WhatsApp.`;

  const cleanPhone = tenantData.phone.replace(/\D/g, "");
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const shareUrl = isMobile
    ? `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(message)}`
    : `https://web.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(message)}`;

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
              <FaWhatsapp size={20} /> Acompanhar pelo WhatsApp
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
