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
  FiSearch,
} from "react-icons/fi";
import config from "../../config";
import Textarea from "../TextArea/TextArea";

const ProductModalMobile = ({
  product = {},
  closeModal,
  addToCart,
  tenantFlavorCalcType,
  fromFavorites = false,
}) => {
  const [selectedFlavors, setSelectedFlavors] = useState([]);
  const [selectedAdditionals, setSelectedAdditionals] = useState([]);
  const [removedCompositions, setRemovedCompositions] = useState([]);
  const [observation, setObservation] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [scrolled, setScrolled] = useState(false);
  const [flavorSearch, setFlavorSearch] = useState("");
  const mainContentRef = useRef(null);

  const hasImage = product.image;

  const normalizeStr = (str) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const sortAlpha = (a, b) =>
    normalizeStr(a.relatedProduct.name || '').localeCompare(normalizeStr(b.relatedProduct.name || ''), 'pt-BR');

  const flavors =
    product.relations?.filter((relation) => relation.type === "flavor") || [];
  const sortedFlavors = [...(fromFavorites ? [...flavors].reverse() : flavors)].sort(sortAlpha);

  const filteredFlavors = flavorSearch
    ? sortedFlavors.filter((relation) => {
        const term = normalizeStr(flavorSearch);
        const name = normalizeStr(relation.relatedProduct.name || '');
        const desc = normalizeStr(relation.relatedProduct.description || '');
        return name.includes(term) || desc.includes(term);
      })
    : sortedFlavors;
  const additionals =
    [...(product.relations?.filter((relation) => relation.type === "additional") || [])].sort(sortAlpha);
  const compositions =
    [...(product.relations?.filter((relation) => relation.type === "composition") || [])].sort(sortAlpha);

  const totalFlavorCount = selectedFlavors.reduce((sum, f) => sum + f.quantity, 0);

  const getFlavorQuantity = (relationId) => {
    const found = selectedFlavors.find((f) => f.id === relationId);
    return found ? found.quantity : 0;
  };

  const getStaticPriceDisplay = () => {
    const productPrice = Number(product.price || 0);

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

    return `R$ ${formatarNumero(productPrice)}`;
  };

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

  const incrementFlavor = (relationId) => {
    if (totalFlavorCount >= product.flavorAllowed) {
      toast.warn(
        `Você pode selecionar no máximo ${product.flavorAllowed} porção(ões).`,
        { theme: "colored", transition: Bounce }
      );
      return;
    }
    setSelectedFlavors((prev) => {
      const existing = prev.find((f) => f.id === relationId);
      if (existing) {
        return prev.map((f) =>
          f.id === relationId ? { ...f, quantity: f.quantity + 1 } : f
        );
      }
      return [...prev, { id: relationId, quantity: 1 }];
    });
  };

  const decrementFlavor = (relationId) => {
    setSelectedFlavors((prev) => {
      const existing = prev.find((f) => f.id === relationId);
      if (!existing) return prev;
      if (existing.quantity <= 1) return prev.filter((f) => f.id !== relationId);
      return prev.map((f) =>
        f.id === relationId ? { ...f, quantity: f.quantity - 1 } : f
      );
    });
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
    if (totalFlavorCount > 0) {
      const weightedSum = selectedFlavors.reduce((sum, f) => {
        const rel = flavors.find((r) => r.id === f.id);
        return sum + (parseFloat(rel?.price || 0) * f.quantity);
      }, 0);

      if (tenantFlavorCalcType === "slot") {
        calculatedFlavorPrice = parseFloat(
          (weightedSum * product.flavorAllowed / totalFlavorCount).toFixed(2)
        );
      } else if (tenantFlavorCalcType === "average") {
        calculatedFlavorPrice = parseFloat(
          (weightedSum / totalFlavorCount).toFixed(2)
        );
      } else if (tenantFlavorCalcType === "largest") {
        calculatedFlavorPrice = selectedFlavors.reduce((max, f) => {
          const rel = flavors.find((r) => r.id === f.id);
          return Math.max(max, parseFloat(rel?.price || 0));
        }, 0);
      } else {
        calculatedFlavorPrice = weightedSum;
      }
    }
    return basePrice + additionalPrice + calculatedFlavorPrice;
  };

  const calculateTotalPrice = () => {
    return calculateItemPrice() * quantity;
  };

  const handleAddToCart = () => {
    if (totalFlavorCount < product.flavorMandatory) {
      toast.warn(
        `Por favor, selecione pelo menos ${product.flavorMandatory} porção(ões) de sabor.`,
        { theme: "colored", transition: Bounce }
      );
      return;
    }

    const selectedFlavorsDetails = selectedFlavors.map(({ id, quantity: qty }) => {
      const rel = product.relations.find((r) => r.id === id);
      let unitPriceForDisplay = parseFloat(rel.price || 0);

      if (tenantFlavorCalcType === "slot" && totalFlavorCount > 0) {
        unitPriceForDisplay = parseFloat(
          (unitPriceForDisplay * product.flavorAllowed / totalFlavorCount).toFixed(2)
        );
      } else if (tenantFlavorCalcType === "average" && totalFlavorCount > 0) {
        unitPriceForDisplay = parseFloat(
          (unitPriceForDisplay / totalFlavorCount).toFixed(2)
        );
      }
      return {
        ...rel,
        price: unitPriceForDisplay,
        quantity: qty,
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
          <FiChevronLeft size={28} color="#fff" />
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
              {getStaticPriceDisplay()}
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
                      {totalFlavorCount}/{product.flavorAllowed}
                    </span>
                    {product.flavorMandatory > 0 && (
                      <span className="badge badge-mandatory">Obrigatório</span>
                    )}
                  </div>
                </h4>
                {flavors.length > 6 && (
                  <div className="flavor-search-wrapper">
                    <FiSearch className="flavor-search-icon" size={16} />
                    <input
                      type="text"
                      className="flavor-search-input"
                      placeholder="Pesquisar sabor..."
                      value={flavorSearch}
                      onChange={(e) => setFlavorSearch(e.target.value)}
                    />
                  </div>
                )}
                {totalFlavorCount > 0 && selectedFlavors.length > 0 && (
                  <div className="selected-flavors-summary">
                    <span className="selected-flavors-summary-title">
                      Selecionados:
                    </span>
                    <div className="selected-flavors-chips">
                      {selectedFlavors.map(({ id, quantity: qty }) => {
                        const rel = flavors.find((r) => r.id === id);
                        if (!rel) return null;
                        return (
                          <span key={id} className="flavor-chip">
                            {toTitleCase(rel.relatedProduct.name)}
                            {qty > 1 && (
                              <span className="flavor-chip-qty"> x{qty}</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {(() => {
                  // Agrupar sabores por relation.group, preservando ordem de aparição dos grupos
                  const groupOrder = [];
                  const grouped = {};
                  filteredFlavors.forEach((relation) => {
                    const g = relation.group?.trim() || '';
                    if (!grouped[g]) { grouped[g] = []; groupOrder.push(g); }
                    grouped[g].push(relation);
                  });
                  const namedGroupsSorted = groupOrder.filter((g) => g !== '');

                  const renderFlavorItem = (relation) => {
                    const qty = getFlavorQuantity(relation.id);
                    const flavorUnitPriceDisplay = parseFloat(relation.price || 0);
                    return (
                      <div
                        className={`flavor-item-row ${qty > 0 ? "flavor-selected" : ""}`}
                        key={relation.id}
                      >
                        <div className="checkbox-content">
                          <span className="option-name">
                            {toTitleCase(relation.relatedProduct.name)}
                          </span>
                          {relation.relatedProduct.description && (
                            <span className="option-desc">
                              {toTitleCase(relation.relatedProduct.description)}
                            </span>
                          )}
                          {flavorUnitPriceDisplay > 0 && (
                            <span className="option-price">
                              + R$ {formatarNumero(flavorUnitPriceDisplay)}
                            </span>
                          )}
                        </div>
                        <div className="flavor-quantity-control">
                          <button
                            type="button"
                            className="flavor-quantity-btn"
                            onClick={() => decrementFlavor(relation.id)}
                            disabled={qty === 0}
                          >
                            <FiMinus size={14} />
                          </button>
                          <span className="flavor-quantity-value">{qty}</span>
                          <button
                            type="button"
                            className="flavor-quantity-btn"
                            onClick={() => incrementFlavor(relation.id)}
                          >
                            <FiPlus size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  };

                  // Se não há grupos definidos, renderiza lista plana (retrocompatível)
                  const hasGroups = namedGroupsSorted.length > 0;
                  if (!hasGroups) {
                    return (
                      <div className="options-list-grid">
                        {filteredFlavors.map(renderFlavorItem)}
                      </div>
                    );
                  }

                  // Renderiza por seção: grupos nomeados (alfabético) primeiro, sem grupo por último
                  const ungrouped = grouped[''] || [];
                  return (
                    <div className="flavor-groups-wrapper">
                      {namedGroupsSorted.map((g) => (
                        <div key={g} className="flavor-group-section">
                          <div className="flavor-group-header">
                            <span className="flavor-group-badge">{g}</span>
                          </div>
                          <div className="options-list-grid">
                            {grouped[g].map(renderFlavorItem)}
                          </div>
                        </div>
                      ))}
                      {ungrouped.length > 0 && (
                        <div className="flavor-group-section">
                          <div className="options-list-grid">
                            {ungrouped.map(renderFlavorItem)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
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
                            <FiRotateCw size={18} color="hsl(var(--primary))" />
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
