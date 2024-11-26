import React, { useState } from "react";
import "./ProductCard.css"; // Estilo do ProductCard
import ProductModal from "../ProductModal/ProductModal"; // Importa o componente de modal
import config from "../../config";

const ProductCard = ({ product, addToCart }) => {
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar a exibição do modal

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
          <h3>{product.name}</h3>
          <p className="product-description">{product.description}</p>
          <p className="product-price">
            <span className="discounted-price">por R$ {product.price}</span>
          </p>
        </div>
        <div className="product-image">
          <img
            src={
              product.image
                ? `${config.baseURL}${product.image}`
                : "/images/pizza_placeholder.png"
            }
            alt={product.name || "Placeholder"}
            onError={(e) => {
              e.target.onerror = null; // Remove o listener de erro para evitar loops infinitos
              e.target.src = "/images/pizza_placeholder.png"; // Define o placeholder no caso de erro ao carregar a imagem
            }}
          />
        </div>
      </div>

      {/* Renderiza o modal se o estado isModalOpen for true */}
      {isModalOpen && (
        <ProductModal
          product={product}
          closeModal={handleCloseModal}
          addToCart={addToCart}
        />
      )}
    </div>
  );
};

export default ProductCard;
