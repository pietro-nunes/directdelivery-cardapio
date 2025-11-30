import React, { useState } from "react";
import "./ProductCard.css"; // Estilo do ProductCard
import ProductModalMobile from "../ProductModalMobile/ProductModalMobile"; // Importa o componente de modal
import config from "../../config";
import { formatarNumero, toTitleCase } from "../../utils/functions";

const ProductCard = ({ product, addToCart, tenantFlavorCalcType }) => {
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar a exibição do modal

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

  // Função para abrir o modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // Função para fechar o modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="product-card" onClick={handleOpenModal}>
        <div className="product-info">
          <h3>{toTitleCase(product.name)}</h3>
          <p className="product-description">{toTitleCase(product.description)}</p>
          <p className="product-price">
            <span className="discounted-price">{getPriceDisplay()}</span>
          </p>
        </div>
        <div className="product-image">
          <img
            src={
              product.image
                ? `${config.baseURL}${product.image}`
                : "/images/pizza_placeholder.png"
            }
            alt={toTitleCase(product.name) || "Placeholder"}
            onError={(e) => {
              e.target.onerror = null; // Remove o listener de erro para evitar loops infinitos
              e.target.src = "/images/pizza_placeholder.png"; // Define o placeholder no caso de erro ao carregar a imagem
            }}
          />
        </div>
      </div>

      {/* Renderiza o modal se o estado isModalOpen for true */}
      {isModalOpen && (
        <ProductModalMobile
          product={product}
          closeModal={handleCloseModal}
          addToCart={addToCart}
          tenantFlavorCalcType={tenantFlavorCalcType}
        />
      )}
    </div>
  );
};

export default ProductCard;