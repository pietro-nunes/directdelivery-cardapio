import React from "react";
import { useLocation } from "react-router-dom";
import "./FabButtonWhats.css"; // Estilo do FAB
import { FaWhatsapp } from "react-icons/fa";

const FabButtonWhats = ({ tenantData, message, isTableMode }) => {
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

  const location = useLocation(); // Use o hook para obter a localização atual

  // Não exibir o FAB se estiver na rota /checkout
  if (
    location.pathname === `/${tenantData.slug}/checkout` ||
    location.pathname === `/${tenantData.slug}/cart` ||
    location.pathname === `/${tenantData.slug}/login` ||
    location.pathname === `/${tenantData.slug}/orderCompleted` ||
    location.pathname === `/${tenantData.slug}/payment` ||
    isTableMode
  ) {
    return null;
  }

  return (
    <div className="fab-button-whats" onClick={handleShare}>
      <FaWhatsapp />
    </div>
  );
};

export default FabButtonWhats;
