import React, { useState } from "react";
import "./ProductModalMobile.css";
import { Bounce, toast } from "react-toastify";
import { formatarNumero } from "../../utils/functions";
import { FiTrash2, FiRotateCw } from "react-icons/fi";

const ProductModalMobile = ({ product = {}, closeModal, addToCart }) => {
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
        ? prev.filter((id) => id !== relationId) // Remove se já estiver na lista
        : [...prev, relationId]; // Adiciona se ainda não estiver
    });
  };

  // Calcular o preço total
  const calculateTotalPrice = () => {
    const additionalPrice = additionals
      .filter((relation) => selectedAdditionals.includes(relation.id))
      .reduce((total, relation) => total + parseFloat(relation.price || 0), 0);

    const flavorPrice = flavors
      .filter((relation) => selectedFlavors.includes(relation.id))
      .reduce((total, relation) => total + parseFloat(relation.price || 0), 0);

    return parseFloat(product.price) + additionalPrice + flavorPrice;
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

    const productWithDetails = {
      ...product,
      selectedFlavors: selectedFlavors.map((id) =>
        product.relations.find((relation) => relation.id === id)
      ),
      selectedAdditionals: selectedAdditionals.map((id) =>
        product.relations.find((relation) => relation.id === id)
      ),
      removedCompositions: removedCompositions.map((id) =>
        product.relations.find((relation) => relation.id === id)
      ),
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
        <div className="modal-body-mobile">
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

          <h3 className="modal-product-name-mobile">
            {product.name || "Nome indisponível"}
          </h3>
          <p className="modal-product-price-mobile">
            R$ {formatarNumero(product.price)}
          </p>
          <p className="modal-product-description-mobile">
            {product.description || ""}
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
                {flavors.map((relation) => (
                  <label className="custom-checkbox-mobile">
                    <input
                      type="checkbox"
                      checked={selectedFlavors.includes(relation.id)}
                      onChange={() => toggleFlavor(relation.id)}
                    />
                    <span className="checkbox-custom-mobile"></span>
                    <span className="flavor-name-mobile">
                      {relation.relatedProduct.name}{" "}
                      {parseFloat(relation.price) > 0 && (
                        <> - R$ {formatarNumero(relation.price)}</>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Adicionais */}
          {additionals.length > 0 && (
            <div className="additionals-section-mobile">
              <h4>Adicionais:</h4>
              <div className="additionals-list-mobile">
                {additionals.map((relation) => (
                  <label className="custom-checkbox-mobile">
                    <input
                      type="checkbox"
                      checked={selectedAdditionals.includes(relation.id)}
                      onChange={() => toggleAdditional(relation.id)} // Permite marcar/desmarcar diretamente no checkbox
                    />
                    <span className="checkbox-custom-mobile"></span>
                    <span className="additional-name-mobile">
                      {relation.relatedProduct.name}{" "}
                      {parseFloat(relation.price) > 0 && (
                        <> - R$ {formatarNumero(relation.price)}</>
                      )}
                    </span>
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
                      {relation.relatedProduct.name}
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
