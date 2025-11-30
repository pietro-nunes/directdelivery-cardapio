// src/components/BestSellerProductCard/BestSellerProductCard.jsx
import "./BestSellerProductCard.css"; // Novo arquivo CSS para este componente
import { formatarNumero, toTitleCase } from "../../utils/functions"; // Presumindo que você já tenha essa função utilitária
import config from "../../config";

const BestSellerProductCard = ({ product, onClick }) => {
  if (!product) return null;

  // Função para calcular o preço exibido
  const getPriceDisplay = () => {
    const productPrice = Number(product.price || 0);
    
    // Se o preço do produto for zero, calcula min/max apenas das relations do tipo "flavor"
    if (productPrice === 0 && product.relations && product.relations.length > 0) {
      const flavorPrices = product.relations
        .filter(rel => rel.type === "flavor")
        .map(rel => Number(rel.price || 0))
        .filter(p => p > 0);
      
      if (flavorPrices.length > 0) {
        const minPrice = Math.min(...flavorPrices);
        const maxPrice = Math.max(...flavorPrices);
        
        if (minPrice === maxPrice) {
          return `por R$ ${formatarNumero(minPrice)}`;
        } else {
          return `A partir de R$ ${formatarNumero(minPrice)} (até R$ ${formatarNumero(maxPrice)})`;
        }
      }
    }
    
    return `por R$ ${formatarNumero(productPrice)}`;
  };

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
            {getPriceDisplay()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BestSellerProductCard;