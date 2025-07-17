import React, { useState } from "react";
import "./ProductModalMobile.css"; // Certifique-se de que o CSS está linkado corretamente
import { Bounce, toast } from "react-toastify";
import { formatarNumero, toTitleCase } from "../../utils/functions";
import { FiTrash2, FiRotateCw } from "react-icons/fi";

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

  // Filtrar relações por tipo
  const flavors =
    product.relations?.filter((relation) => relation.type === "flavor") || [];
  const additionals =
    product.relations?.filter((relation) => relation.type === "additional") ||
    [];
  const compositions =
    product.relations?.filter((relation) => relation.type === "composition") ||
    [];

  // Função para alternar seleção de sabores
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

  // Função para alternar seleção de adicionais
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

  // --- FUNÇÃO DE CÁLCULO DE PREÇO TOTAL (CORRIGIDA NOVAMENTE) ---
  const calculateTotalPrice = () => {
    let basePrice = parseFloat(product.price || 0);

    // 1. Calcular preço dos adicionais selecionados
    const additionalPrice = additionals
      .filter((r) => selectedAdditionals.includes(r.id))
      .reduce((sum, r) => sum + parseFloat(r.price || 0), 0);

    // 2. Calcular preço dos sabores selecionados com base em tenantFlavorCalcType
    let calculatedFlavorPrice = 0;
    if (selectedFlavors.length > 0) {
      const sumOfSelectedFlavorRelationsPrice = selectedFlavors
        .map((id) => flavors.find((r) => r.id === id))
        .reduce((sum, r) => sum + parseFloat(r?.price || 0), 0);

      // AQUI É A MUDANÇA: DIVIDIR PELA QUANTIDADE DE SABORES SELECIONADOS
      if (
        tenantFlavorCalcType === "average" &&
        selectedFlavors.length > 0 // <-- MUDANÇA AQUI: usar selectedFlavors.length
      ) {
        calculatedFlavorPrice = parseFloat(
          (
            sumOfSelectedFlavorRelationsPrice / selectedFlavors.length
          ).toFixed(2)
        );
      } else {
        // Se for "sum" ou outro, usa a soma direta das relações
        calculatedFlavorPrice = sumOfSelectedFlavorRelationsPrice;
      }
    }

    return basePrice + additionalPrice + calculatedFlavorPrice;
  };

  // --- LÓGICA DE ADICIONAR AO CARRINHO (CORRIGIDA NOVAMENTE) ---
  const handleAddToCart = () => {
    if (selectedFlavors.length < product.flavorMandatory) {
      toast.warn(
        `Por favor, selecione pelo menos ${product.flavorMandatory} sabor(es).`,
        { theme: "colored", transition: Bounce }
      );
      return;
    }

    // Mapear sabores, sobrescrevendo o preço unitário para exibição no carrinho
    const selectedFlavorsDetails = selectedFlavors.map((id) => {
      const rel = product.relations.find((r) => r.id === id);
      let unitPriceForDisplay = parseFloat(rel.price || 0);

      // AQUI É A MUDANÇA: DIVIDIR PELA QUANTIDADE DE SABORES SELECIONADOS
      if (
        tenantFlavorCalcType === "average" &&
        selectedFlavors.length > 0 // <-- MUDANÇA AQUI: usar selectedFlavors.length
      ) {
        unitPriceForDisplay = parseFloat(
          (unitPriceForDisplay / selectedFlavors.length).toFixed(2)
        );
      }

      return {
        ...rel,
        price: unitPriceForDisplay,
      };
    });

    // Mapear adicionais selecionados
    const selectedAdditionalsDetails = selectedAdditionals.map((id) =>
      product.relations.find((r) => r.id === id)
    );

    // Mapear composições removidas
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
      totalPrice: calculateTotalPrice(),
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
        <div className="back-button-mobile" onClick={closeModal}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="black"
            className="back-icon-mobile"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12H3m0 0l6-6m-6 6l6 6"
            />
          </svg>
        </div>

        <div className="modal-body-mobile">
          <h3 className="modal-product-name-mobile">
            {toTitleCase(product.name) || "Nome indisponível"}
          </h3>
          <p className="modal-product-price-mobile">
            R$ {formatarNumero(product.price)}
          </p>
          <p className="modal-product-description-mobile">
            {toTitleCase(product.description) || ""}
          </p>

          {/* Sabores */}
          {flavors.length > 0 && (
            <div className="flavors-section-mobile">
              <h4>
                Escolha até {product.flavorAllowed} sabor(es):{" "}
                {product.flavorMandatory > 0 &&
                  `(Obrigatório: ${product.flavorMandatory})`}
              </h4>
              <div className="flavors-list-mobile">
                {flavors.map((relation) => {
                  // AQUI É A MUDANÇA: DIVIDIR PELA QUANTIDADE DE SABORES SELECIONADOS
                  const flavorUnitPriceForDisplay =
                    tenantFlavorCalcType === "average" &&
                    selectedFlavors.length > 0 // <-- MUDANÇA AQUI: usar selectedFlavors.length
                      ? parseFloat(
                          (
                            parseFloat(relation.price || 0) /
                            selectedFlavors.length
                          ).toFixed(2)
                        )
                      : parseFloat(relation.price || 0);

                  return (
                    <label
                      className="custom-checkbox-mobile"
                      key={relation.id}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFlavors.includes(relation.id)}
                        onChange={() => toggleFlavor(relation.id)}
                      />
                      <span className="checkbox-custom-mobile"></span>
                      <div className="flavor-info-mobile">
                        <span className="flavor-name-mobile">
                          {toTitleCase(relation.relatedProduct.name)}
                          {flavorUnitPriceForDisplay > 0 && (
                            <> – R$ {formatarNumero(flavorUnitPriceForDisplay)}</>
                          )}
                        </span>
                        {relation.relatedProduct.description && (
                          <span className="flavor-desc-mobile">
                            {toTitleCase(
                              relation.relatedProduct.description
                            )}
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Adicionais */}
          {additionals.length > 0 && (
            <div className="additionals-section-mobile">
              <h4>Adicionais:</h4>
              <div className="additionals-list-mobile">
                {additionals.map((relation) => (
                  <label
                    className="custom-checkbox-mobile"
                    key={relation.id}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAdditionals.includes(relation.id)}
                      onChange={() => toggleAdditional(relation.id)}
                    />
                    <span className="checkbox-custom-mobile"></span>
                    <div className="additional-info-mobile">
                      <span className="additional-name-mobile">
                        {toTitleCase(relation.relatedProduct.name)}
                        {parseFloat(relation.price || 0) > 0 && (
                          <> – R$ {formatarNumero(relation.price)}</>
                        )}
                      </span>
                      {relation.relatedProduct.description && (
                        <span className="additional-desc-mobile">
                          {toTitleCase(
                            relation.relatedProduct.description
                          )}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Composições */}
          {compositions.length > 0 && (
            <div className="compositions-section-mobile">
              <h4>Composições:</h4>
              <ul className="compositions-list-mobile">
                {compositions.map((relation) => {
                  const isRemoved = removedCompositions.includes(relation.id);
                  return (
                    <li
                      className={`composition-card-mobile ${
                        isRemoved ? "removed-composition" : ""
                      }`}
                      key={relation.id}
                    >
                      {toTitleCase(relation.relatedProduct.name)}
                      <button
                        className="delete-button"
                        onClick={() => removeComposition(relation.id)}
                      >
                        {isRemoved ? (
                          <FiRotateCw size={20} color="green" />
                        ) : (
                          <FiTrash2 size={20} />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Observações */}
          <div className="observations-section-mobile">
            <h4>Observações:</h4>
            <textarea
              className="observations-mobile"
              placeholder="Ex.: Sem cebola, sem ovo, etc."
              maxLength={150}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer-mobile">
          <button
            onClick={handleAddToCart}
            className="add-to-cart-button-mobile"
          >
            Adicionar ao Carrinho
          </button>
          <span className="modal-total-price-mobile">
            Total: R$ {formatarNumero(calculateTotalPrice())}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductModalMobile;