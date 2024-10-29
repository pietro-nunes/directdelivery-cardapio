import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./FabButton.css"; // Estilo do FAB
import { FaShoppingCart } from "react-icons/fa";

const FabButton = ({ cartItems }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/cart", { state: { cartItems } }); // Mudando para /cart
  };

  const location = useLocation(); // Use o hook para obter a localização atual

  // Não exibir o FAB se estiver na rota /checkout
  if (
    location.pathname === "/checkout" ||
    location.pathname === "/cart" ||
    location.pathname === "/login"
  ) {
    return null;
  }

  const itemCount = cartItems.reduce((total, item) => total + item.count, 0);

  return (
    <div className="fab-button" onClick={handleClick}>
      <FaShoppingCart />
      {itemCount > 0 && <span className="item-count">{itemCount}</span>}
    </div>
  );
};

export default FabButton;
