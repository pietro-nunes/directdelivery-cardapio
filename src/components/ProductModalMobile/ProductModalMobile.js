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

  // --- CORREÇÃO FINAL: Calcular o preço total USANDO SEMPRE O VALOR DA RELAÇÃO PARA SABORES ---
  const calculateTotalPrice = () => {
    let basePrice = parseFloat(product.price || 0);

    const additionalPrice = additionals
      .filter((r) => selectedAdditionals.includes(r.id))
      .reduce((sum, r) => sum + parseFloat(r.price || 0), 0);

    let calculatedFlavorPrice = 0;
    if (selectedFlavors.length > 0) {
      // 1. Somar o preço ORIGINAL de todas as relações de sabores selecionadas
      const sumOfSelectedFlavorRelationsPrice = selectedFlavors
        .map((id) => flavors.find((r) => r.id === id))
        .reduce((sum, r) => sum + parseFloat(r?.price || 0), 0);

      // 2. Aplicar a regra de cálculo (average ou sum)
      if (tenantFlavorCalcType === "average" && product.flavorAllowed > 0) {
        // Se for "average", pega a soma dos preços das relações selecionadas e divide
        calculatedFlavorPrice = parseFloat(
          (sumOfSelectedFlavorRelationsPrice / product.flavorAllowed).toFixed(2)
        );
      } else {
        // Se for "sum" (ou qualquer outro que não seja average), simplesmente usa a soma original
        calculatedFlavorPrice = sumOfSelectedFlavorRelationsPrice;
      }
    }

    return basePrice + additionalPrice + calculatedFlavorPrice;
  };

  // Validação e adição ao carrinho
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
      let unitPriceForDisplay = parseFloat(rel.price || 0); // Preço padrão do sabor da relação

      if (tenantFlavorCalcType === "average" && product.flavorAllowed > 0) {
        // Se o cálculo é por média, o preço unitário do sabor para exibição no carrinho
        // é o preço original da relação dividido pelo número de sabores permitidos.
        // ISSO NÃO AFETA O CÁLCULO TOTAL, APENAS A EXIBIÇÃO DETALHADA NO CARRINHO
        unitPriceForDisplay = parseFloat(
          (unitPriceForDisplay / product.flavorAllowed).toFixed(2)
        );
      }
      // Se tenantFlavorCalcType for "sum", o unitPriceForDisplay já é o rel.price

      return {
        ...rel,
        price: unitPriceForDisplay, // Este é o preço do sabor para ser registrado no carrinho (para exibição detalhada)
      };
    });

    // Demais detalhes
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
      selectedObservations: [], // ou lógica específica se houver
      observation,
      totalPrice: calculateTotalPrice(), // Chama a função corrigida
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
                  // AQUI VOCÊ EXIBE O PREÇO UNITÁRIO DO SABOR, que PODE ser o da relação ou dividido.
                  const flavorUnitPriceForDisplay =
                    tenantFlavorCalcType === "average" && product.flavorAllowed > 0
                      ? parseFloat(
                          (parseFloat(relation.price || 0) / product.flavorAllowed).toFixed(2)
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