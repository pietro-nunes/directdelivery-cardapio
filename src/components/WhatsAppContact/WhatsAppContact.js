import React from "react";
import "./WhatsAppContact.css";
import { FaWhatsapp } from "react-icons/fa";

const WhatsAppContact = ({ tenantData, message }) => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const shareUrl = isMobile
    ? `https://api.whatsapp.com/send?phone=55${
        tenantData.phone
      }&text=${encodeURIComponent(message)}`
    : `https://web.whatsapp.com/send?phone=55${
        tenantData.phone
      }&text=${encodeURIComponent(message)}`;

  const handleContact = () => {
    window.open(shareUrl, "_blank");
  };

  return (
    <div className="whatsapp-contact-section">
      <div className="whatsapp-contact-card" onClick={handleContact}>
        <div className="whatsapp-icon-wrapper">
          <FaWhatsapp className="whatsapp-icon" />
        </div>
        <div className="whatsapp-text">
          <h3 className="whatsapp-title">Precisa de ajuda?</h3>
          <p className="whatsapp-description">
            Entre em contato pelo WhatsApp com o restaurante
          </p>
        </div>
        <span className="whatsapp-cta">Falar agora</span>
      </div>
    </div>
  );
};

export default WhatsAppContact;
