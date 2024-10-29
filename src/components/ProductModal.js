import React, { useState, useEffect } from "react";
import ProductModalMobile from "./ProductModalMobile";
import ProductModalDesktop from "./ProductModalDesktop";

const ProductModal = ({ product, closeModal, addToCart }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile ? (
    <ProductModalMobile product={product} closeModal={closeModal} addToCart={addToCart} />
  ) : (
    <ProductModalDesktop product={product} closeModal={closeModal} addToCart={addToCart} />
  );
};

export default ProductModal;
