import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./FabButton.css";
import { FaShoppingCart } from "react-icons/fa";
import { formatarNumero } from "../../utils/functions";

const FabButton = ({ basePath, cartItems }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`${basePath}/cart`, { state: { cartItems } });
  };

  const location = useLocation();

  // Não exibir o FAB se estiver na rota /checkout
  if (
    location.pathname === `${basePath}/checkout` ||
    location.pathname === `${basePath}/cart` ||
    location.pathname === `${basePath}/login` ||
    location.pathname === `${basePath}/orderCompleted` ||
    location.pathname === `${basePath}/payment`
  ) {
    return null;
  }

  const itemCount = cartItems.reduce((total, item) => total + item.count, 0);
  const totalPrice = cartItems.reduce((total, item) => total + (item.unitPrice * item.count), 0);

  return (
    <div className="fab-button" onClick={handleClick}>
      <FaShoppingCart />
      <span className="fab-text">
        <span className="fab-price">R$ {formatarNumero(totalPrice)}</span>
        <span className="fab-items">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
      </span>
    </div>
  );
};

export default FabButton;
