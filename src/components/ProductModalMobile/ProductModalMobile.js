import React, { useState, useEffect, useRef } from "react";
import "./ProductModalMobile.css";
import { Bounce, toast } from "react-toastify";
import { formatarNumero, toTitleCase } from "../../utils/functions";
import {
  FiTrash2,
  FiRotateCw,
  FiChevronLeft,
  FiMinus,
  FiPlus,
} from "react-icons/fi";
import config from "../../config";
import Textarea from "../TextArea/TextArea";

const ProductModalMobile = ({
  product = {},
  closeModal,
  addToCart,
  tenantFlavorCalcType,
}) => {
  const [selectedFlavors, setSelectedFlavors] = useState([]);
  const [selectedAdditionals, setSelectedAdditionals] = useState([]);
  const [removedCompositions, setRemovedCompositions] = useState([]);
  const [observation, setObservation] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [scrolled, setScrolled] = useState(false);
  const mainContentRef = useRef(null);

  const hasImage = product.image;

  const flavors =
    product.relations?.filter((relation) => relation.type === "flavor") || [];
  const additionals =
    product.relations?.filter((relation) => relation.type === "additional") ||
    [];
  const compositions =
    product.relations?.filter((relation) => relation.type === "composition") ||
    [];

  useEffect(() => {
    const handleScroll = () => {
      if (mainContentRef.current) {
        const threshold = hasImage ? 150 : 20;
        if (mainContentRef.current.scrollTop > threshold) {
          setScrolled(true);
        } else {
          setScrolled(false);
        }
      }
    };

    const currentRef = mainContentRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener("scroll", handleScroll);
      }
    };
  }, [hasImage]);

  const toggleFlavor = (relationId) => {
    if (selectedFlavors.includes(relationId)) {
      setSelectedFlavors((prev) => prev.filter((id) => id !== relationId));
    } else if (selectedFlavors.length < product.flavorAllowed) {
      setSelectedFlavors((prev) => [...prev, relationId]);
    } else {
      toast.warn(
        `Você pode selecionar no máximo ${product.flavorAllowed} sabor(es).`,
        { theme: "colored", transition: Bounce }
      );
    }
  };

  const toggleAdditional = (relationId) => {
    if (selectedAdditionals.includes(relationId)) {
      setSelectedAdditionals((prev) => prev.filter((id) => id !== relationId));
    } else {
      setSelectedAdditionals((prev) => [...prev, relationId]);
    }
  };

  const removeComposition = (relationId) => {
    setRemovedCompositions((prev) => {
      const isAlreadyRemoved = prev.includes(relationId);
      return isAlreadyRemoved
        ? prev.filter((id) => id !== relationId)
        : [...prev, relationId];
    });
  };

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const calculateItemPrice = () => {
    let basePrice = parseFloat(product.price || 0);
    const additionalPrice = additionals
      .filter((r) => selectedAdditionals.includes(r.id))
      .reduce((sum, r) => sum + parseFloat(r.price || 0), 0);

    let calculatedFlavorPrice = 0;
    if (selectedFlavors.length > 0) {
      const sumOfSelectedFlavorRelationsPrice = selectedFlavors
        .map((id) => flavors.find((r) => r.id === id))
        .reduce((sum, r) => sum + parseFloat(r?.price || 0), 0);

      if (tenantFlavorCalcType === "average" && selectedFlavors.length > 0) {
        calculatedFlavorPrice = parseFloat(
          (sumOfSelectedFlavorRelationsPrice / selectedFlavors.length).toFixed(
            2
          )
        );
      } else {
        calculatedFlavorPrice = sumOfSelectedFlavorRelationsPrice;
      }
    }
    return basePrice + additionalPrice + calculatedFlavorPrice;
  };

  const calculateTotalPrice = () => {
    return calculateItemPrice() * quantity;
  };

  const handleAddToCart = () => {
    if (selectedFlavors.length < product.flavorMandatory) {
      toast.warn(
        `Por favor, selecione pelo menos ${product.flavorMandatory} sabor(es).`,
        { theme: "colored", transition: Bounce }
      );
      return;
    }

    const selectedFlavorsDetails = selectedFlavors.map((id) => {
      const rel = product.relations.find((r) => r.id === id);
      let unitPriceForDisplay = parseFloat(rel.price || 0);

      if (tenantFlavorCalcType === "average" && selectedFlavors.length > 0) {
        unitPriceForDisplay = parseFloat(
          (unitPriceForDisplay / selectedFlavors.length).toFixed(2)
        );
      }
      return {
        ...rel,
        price: unitPriceForDisplay,
      };
    });

    const selectedAdditionalsDetails = selectedAdditionals.map((id) =>
      product.relations.find((r) => r.id === id)
    );

    const removedCompositionsDetails = removedCompositions.map((id) =>
      product.relations.find((r) => r.id === id)
    );

    const productWithDetails = {
      ...product,
      selectedFlavors: selectedFlavorsDetails,
      selectedAdditionals: selectedAdditionalsDetails,
      removedCompositions: removedCompositionsDetails,
      selectedObservations: [],
      observation,
      unitPrice: calculateItemPrice(),
      totalPrice: calculateTotalPrice(),
      quantity,
    };

    addToCart(productWithDetails);
    toast.success("Produto adicionado ao carrinho!", {
      theme: "colored",
      transition: Bounce,
    });
    closeModal();
  };

  return (
    <div className="modal-overlay-mobile" onClick={closeModal}>
      <div
        className="modal-content-mobile"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={`back-button-overlay ${scrolled ? "scrolled" : ""}`}
          onClick={closeModal}
        >
          <FiChevronLeft
            size={30}
            color={scrolled || !hasImage ? "#333" : "#fff"}
          />
        </button>

        <div className="modal-main-content" ref={mainContentRef}>
          {hasImage ? (
            <div className="product-image-section">
              <img
                src={`${config.baseURL}${product.image}`}
                alt={toTitleCase(product.name)}
                className="product-modal-image"
              />
            </div>
          ) : (
            <div className="product-title-no-image-section">
              <h3 className="modal-product-name-mobile">
                {toTitleCase(product.name) || "Nome indisponível"}
              </h3>
            </div>
          )}

          <div className="product-details-summary">
            {hasImage && (
              <h3 className="modal-product-name-mobile">
                {toTitleCase(product.name) || "Nome indisponível"}
              </h3>
            )}
            <p className="modal-product-price-mobile">
              R$ {formatarNumero(product.price)}
            </p>
            <p className="modal-product-description-mobile">
              {toTitleCase(product.description) || ""}
            </p>
          </div>

          <div className="options-sections-wrapper">
            {flavors.length > 0 && (
              <div className="option-section-card">
                <h4 className="options-header">
                  Escolha seu sabor
                  <div className="options-badges">
                    <span className="badge badge-info">
                      Até {product.flavorAllowed}
                    </span>
                    {product.flavorMandatory > 0 && (
                      <span className="badge badge-mandatory">Obrigatório</span>
                    )}
                  </div>
                </h4>
                <div className="options-list-grid">
                  {flavors.map((relation) => {
                    const flavorUnitPriceForDisplay =
                      tenantFlavorCalcType === "average" &&
                      selectedFlavors.length > 0
                        ? parseFloat(
                            (
                              parseFloat(relation.price || 0) /
                              selectedFlavors.length
                            ).toFixed(2)
                          )
                        : parseFloat(relation.price || 0);
                    return (
                      <label className="custom-checkbox-card" key={relation.id}>
                        <input
                          type="checkbox"
                          checked={selectedFlavors.includes(relation.id)}
                          onChange={() => toggleFlavor(relation.id)}
                        />
                        <div className="checkbox-content">
                          <span className="option-name">
                            {toTitleCase(relation.relatedProduct.name)}
                          </span>
                          {relation.relatedProduct.description && (
                            <span className="option-desc">
                              {toTitleCase(relation.relatedProduct.description)}
                            </span>
                          )}
                          {flavorUnitPriceForDisplay > 0 && (
                            <span className="option-price">
                              + R$ {formatarNumero(flavorUnitPriceForDisplay)}
                            </span>
                          )}
                        </div>
                        <span className="checkbox-indicator"></span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {compositions.length > 0 && (
              <div className="option-section-card">
                <h4 className="options-header">
                  Deseja remover algum ingrediente?
                  <div className="options-badges">
                    <span className="badge badge-info">
                      Clique para remover
                    </span>
                  </div>
                </h4>
                <div className="compositions-list">
                  {compositions.map((relation) => {
                    const isRemoved = removedCompositions.includes(relation.id);
                    return (
                      <div
                        className={`composition-item ${
                          isRemoved ? "removed-composition" : ""
                        }`}
                        key={relation.id}
                      >
                        <span className="composition-name">
                          {toTitleCase(relation.relatedProduct.name)}
                        </span>
                        <button
                          className="toggle-composition-button"
                          onClick={() => removeComposition(relation.id)}
                        >
                          {isRemoved ? (
                            <FiRotateCw size={18} color="#1a9b9b" />
                          ) : (
                            <FiTrash2 size={18} color="#d9534f" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {additionals.length > 0 && (
              <div className="option-section-card">
                <h4 className="options-header">
                  Quer turbinar seu item com adicionais?
                  <div className="options-badges">
                    <span className="badge badge-info">Opcional</span>
                  </div>
                </h4>
                <div className="options-list-grid">
                  {additionals.map((relation) => (
                    <label className="custom-checkbox-card" key={relation.id}>
                      <input
                        type="checkbox"
                        checked={selectedAdditionals.includes(relation.id)}
                        onChange={() => toggleAdditional(relation.id)}
                      />
                      <div className="checkbox-content">
                        <span className="option-name">
                          {toTitleCase(relation.relatedProduct.name)}
                        </span>
                        {relation.relatedProduct.description && (
                          <span className="option-desc">
                            {toTitleCase(relation.relatedProduct.description)}
                          </span>
                        )}
                        {parseFloat(relation.price || 0) > 0 && (
                          <span className="option-price">
                            + R$ {formatarNumero(relation.price)}
                          </span>
                        )}
                      </div>
                      <span className="checkbox-indicator"></span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="option-section-card">
              <h4 className="options-header">
                Observações
                <div className="options-badges">
                  <span className="badge badge-info">Opcional</span>
                </div>
              </h4>
              <Textarea
                id="obs"
                name="observations"
                value={observation}
                onChange={setObservation}
                max={80} 
                placeholder="Ex.: Sem cebola, sem ovo, etc."
              />
            </div>
          </div>
        </div>

        <div className="modal-sticky-footer">
          <div className="quantity-control-container">
            <button className="quantity-button" onClick={decreaseQuantity}>
              <FiMinus size={20} color="#333" />
            </button>
            <span className="quantity-display">{quantity}</span>
            <button className="quantity-button" onClick={increaseQuantity}>
              <FiPlus size={20} color="#333" />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="add-to-cart-button-mobile"
          >
            Adicionar{" "}
            <span className="add-to-cart-price">
              R$ {formatarNumero(calculateTotalPrice())}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModalMobile;
