// src/components/BestSellerProductCard/BestSellerProductCard.jsx
import "./BestSellerProductCard.css"; // Novo arquivo CSS para este componente
import { formatarNumero, toTitleCase } from "../../utils/functions"; // Presumindo que você já tenha essa função utilitária
import config from "../../config";

const BestSellerProductCard = ({ product, onClick }) => {
  if (!product) return null;

  return (
    <div className="best-seller-product-card" onClick={onClick}>
      <div className="best-seller-image-wrapper">
        <img
          src={
            product.image
              ? `${config.baseURL}${product.image}`
              : "/images/pizza_placeholder.png"
          }
          alt={product.name}
          className="best-seller-product-image"
        />
        <span className="best-seller-badge">🔥 MAIS VENDIDO 🔥</span>
      </div>
      <div className="best-seller-info">
        <h4 className="best-seller-name">{toTitleCase(product.name)}</h4>
        <p className="best-seller-description">
          {toTitleCase(product.description)}
        </p>
        <div className="best-seller-price-display">
          <span className="best-seller-price">
            R$ {formatarNumero(product.price)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BestSellerProductCard;
