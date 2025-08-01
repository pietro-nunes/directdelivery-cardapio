// src/components/BestSellerProductCard/BestSellerProductCard.jsx
import { useState } from "react";
import "./BestSellerProductCard.css"; // Novo arquivo CSS para este componente
import { formatarNumero, toTitleCase } from "../../utils/functions"; // Presumindo que você já tenha essa função utilitária
import ProductModalMobile from "../ProductModalMobile/ProductModalMobile";
import config from "../../config";

const BestSellerProductCard = ({
  product,
  addToCart,
  tenantFlavorCalcType,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar a exibição do modal

  if (!product) {
    return null; // Não renderiza se os dados do produto estiverem faltando
  }

  // Função para abrir o modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // Função para fechar o modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="best-seller-product-card" onClick={handleOpenModal}>
        {" "}
        {/* Card inteiro clicável */}
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
          {/* O valor do produto está de volta aqui! */}
          <div className="best-seller-price-display">
            <span className="best-seller-price">
              R$ {formatarNumero(product.price)}
            </span>
          </div>
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
    </>
  );
};

export default BestSellerProductCard;
