import React, { useState } from "react";
import Accordion from "./Accordion"; // Importa o componente Accordion
import "./ProductModalMobile.css";
import { Bounce, toast } from "react-toastify";

const ProductModalMobile = ({ product = {}, closeModal, addToCart }) => {
  const [selectedAccompaniments, setSelectedAccompaniments] = useState({});
  const [observation, setObservation] = useState(""); // Estado para a observação

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
    if (!product.sessions || product.sessions.length === 0) {
      const productWithMemo = {
        ...product,
        selectedAccompaniments: [],
        observation: observation, // Adiciona a observação
        totalPrice: product.price || 0,
      };
      addToCart(productWithMemo);
      toast.success("Obaa! Item adicionado ao carrinho!", {
        theme: "colored",
        transition: Bounce,
      });
      closeModal();
      return;
    }

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
      observation: observation, // Adiciona a observação
      totalPrice: totalPrice,
    };
    addToCart(productWithMemo);
    toast.success("Obaa! Item adicionado ao carrinho!", {
      theme: "colored",
      transition: Bounce,
    });
    closeModal();
  };

  return (
    <div className="modal-overlay-mobile" onClick={closeModal}>
      <div className="modal-content-mobile" onClick={(e) => e.stopPropagation()}>
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
            {product.name || "Nome indisponível"}
          </h3>
          <p className="modal-product-price-mobile">
            R$ {product.price ? product.price.toFixed(2) : "Preço indisponível"}
          </p>
          <p className="modal-product-description-mobile">
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
                {selectedAccompaniments[session.id] &&
                  selectedAccompaniments[session.id].length >=
                    session.allowed && (
                    <div className="limit-warning">
                      <span> Selecionado</span>
                    </div>
                  )}
                <div className="accompaniments-list-mobile">
                  {session.itens.map((item) => {
                    const isChecked = (
                      selectedAccompaniments[session.id] || []
                    ).includes(item.id);
                    const isDisabled =
                      (selectedAccompaniments[session.id] || []).length >=
                        session.allowed && !isChecked;

                    return (
                      <div className="accompaniment-card-mobile" key={item.id}>
                        <label className="custom-checkbox-mobile">
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
                            className={`checkbox-custom-mobile ${
                              isDisabled ? "disabled-checkbox" : ""
                            }`}
                          ></span>
                          <span className="accompaniment-name-mobile">
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
              </Accordion>
            ))}

          {/* Seção de Observações */}
          <div className="observations-section-mobile">
            <h4>Observações:</h4>
            <textarea
              className="observations-mobile"
              placeholder="Ex.: Tirar cebola, ovo, etc."
              value={observation}
              onChange={(e) => setObservation(e.target.value)} // Atualiza o estado da observação
            />
          </div>
        </div>

        <div className="modal-footer-mobile">
          <div onClick={handleAddToCart} className="add-to-cart-button-mobile">
            Adicionar ao Carrinho
          </div>
          <span className="modal-total-price-mobile">
            R$ {product.price ? product.price.toFixed(2) : "Preço indisponível"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductModalMobile;
