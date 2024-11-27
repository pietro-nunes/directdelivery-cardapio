import React from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import "./FabButtonWhats.css"; // Estilo do FAB
import { FaShoppingCart } from "react-icons/fa";
import { FaWhatsapp } from "react-icons/fa";

const FabButtonWhats = ({ tenantData, message }) => {

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const shareUrl = isMobile
        ? `https://api.whatsapp.com/send?phone=55${tenantData.phone}&text=${encodeURIComponent(message)}`
        : `https://web.whatsapp.com/send?phone=55${tenantData.phone}&text=${encodeURIComponent(message)}`;


    const handleShare = () => {
        // Abre a URL em uma nova aba
        window.open(shareUrl, "_blank");
    };


    return (
        <div className="fab-button-whats" onClick={handleShare}>
            <FaWhatsapp />
        </div>
    );
};

export default FabButtonWhats;
