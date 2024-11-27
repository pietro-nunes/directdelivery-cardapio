import React from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import "./FabButton.css"; // Estilo do FAB
import { FaShoppingCart } from "react-icons/fa";

const FabButton = ({ cartItems }) => {
  const navigate = useNavigate();
  const { slug } = useParams(); // Captura o slug diretamente da URL
  
  const handleClick = () => {
    navigate(`/${slug}/cart`, { state: { cartItems } }); // Mudando para /cart
  };

  const location = useLocation(); // Use o hook para obter a localização atual

  // Não exibir o FAB se estiver na rota /checkout
  if (
    location.pathname === `/${slug}/checkout` ||
    location.pathname === `/${slug}/cart` ||
    location.pathname === `/${slug}/login` ||
    location.pathname === `/${slug}/orderCompleted`
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
