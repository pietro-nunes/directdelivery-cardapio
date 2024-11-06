import React, { useState } from "react";
import Accordion from "../Accordion/Accordion"; // Importa o componente Accordion
import "./ProductModalDesktop.css"; // Novo arquivo CSS para desktop
import { Bounce, toast } from "react-toastify";

const ProductModalDesktop = ({ product = {}, closeModal, addToCart }) => {
  const [selectedAccompaniments, setSelectedAccompaniments] = useState({}); // Usar um objeto para armazenar seleções por sessão

  const handleAccompanimentChange = (sessionId, accompanimentId, allowed) => {
    const currentSelections = selectedAccompaniments[sessionId] || [];

    if (currentSelections.includes(accompanimentId)) {
      setSelectedAccompaniments((prevSelections) => ({
        ...prevSelections,
        [sessionId]: prevSelections[sessionId].filter(
          (id) => id !== accompanimentId
        ),
      }));
    } else {
      if (currentSelections.length < allowed) {
        setSelectedAccompaniments((prevSelections) => ({
          ...prevSelections,
          [sessionId]: [...currentSelections, accompanimentId],
        }));
      }
    }
  };

  const handleAddToCart = () => {
    const selectedAccompanimentDetails =
      product.sessions.flatMap((session) => {
        const selectedItems = selectedAccompaniments[session.id] || [];
        return session.itens.filter((item) => selectedItems.includes(item.id));
      }) || [];

    const mandatoryCheck = product.sessions.every((session) => {
      const selectedCount = selectedAccompanimentDetails.filter((item) =>
        selectedAccompaniments[session.id]?.includes(item.id)
      ).length;
      return selectedCount >= session.mandatory;
    });

    if (!mandatoryCheck) {
      toast.warn("Selecione todos os itens obrigatórios.", {
        theme: "colored",
        transition: Bounce,
      });
      return;
    }

    const totalPrice = selectedAccompanimentDetails.reduce((total, item) => {
      return total + (item.price || 0);
    }, 0);

    const productWithMemo = {
      ...product,
      selectedAccompaniments: selectedAccompanimentDetails,
      totalPrice: totalPrice,
    };
    addToCart(productWithMemo);
    toast.success("Produto adicionado ao carrinho!", {
      theme: "colored",
      transition: Bounce,
    });
    closeModal();
  };

  return (
    <div className="modal-overlay-desktop" onClick={closeModal}>
      <div className="modal-content-desktop" onClick={(e) => e.stopPropagation()}>
        <div className="back-button-desktop" onClick={closeModal}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="black"
            className="back-icon-desktop"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12H3m0 0l6-6m-6 6l6 6"
            />
          </svg>
        </div>

        <div className="modal-body-desktop">
          <h3 className="modal-product-name-desktop">
            {product.name || "Nome indisponível"}
          </h3>
          <p className="modal-product-price-desktop">
            R$ {product.price ? product.price.toFixed(2) : "Preço indisponível"}
          </p>
          <p className="modal-product-description-desktop">
            {product.description || "Descrição indisponível"}
          </p>

          {product.sessions &&
            product.sessions.length > 0 &&
            product.sessions.map((session) => (
              <Accordion key={session.id} title={session.title}>
                <p>
                  Escolha até {session.allowed} itens
                  {session.mandatory > 0 ? " (obrigatório)" : ""}
                </p>
                <div className="accompaniments-list-desktop">
                  {session.itens.map((item) => {
                    const isChecked = (
                      selectedAccompaniments[session.id] || []
                    ).includes(item.id);
                    const isDisabled =
                      (selectedAccompaniments[session.id] || []).length >=
                        session.allowed && !isChecked;

                    return (
                      <div className="accompaniment-card-desktop" key={item.id}>
                        <label className="custom-checkbox-desktop">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              handleAccompanimentChange(
                                session.id,
                                item.id,
                                session.allowed
                              )
                            }
                            disabled={isDisabled}
                          />
                          <span
                            className={`checkbox-custom-desktop ${
                              isDisabled ? "disabled-checkbox" : ""
                            }`}
                          ></span>
                          <span className="accompaniment-name-desktop">
                            {item.name}
                            {item.price > 0 ? (
                              <> - R$ {item.price.toFixed(2)}</>
                            ) : null}
                          </span>
                        </label>
                      </div>
                    );
                  })}
                </div>
                {selectedAccompaniments[session.id] &&
                  selectedAccompaniments[session.id].length >=
                    session.allowed && (
                    <p className="limit-warning-desktop">
                      🎉 Você atingiu o limite de seleção para este item.
                    </p>
                  )}
              </Accordion>
            ))}

          <div className="observations-section-desktop">
            <h4>Observações</h4>
            <textarea
              className="observations-desktop"
              placeholder="Ex.: Tirar cebola, ovo, etc."
            />
          </div>
        </div>

        <div className="modal-footer-desktop">
          <div onClick={handleAddToCart} className="add-to-cart-button-desktop">
            Adicionar ao Carrinho
          </div>
          <span className="modal-total-price-desktop">
            R$ {product.price ? product.price.toFixed(2) : "Preço indisponível"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductModalDesktop;
