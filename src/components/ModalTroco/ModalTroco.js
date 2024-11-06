// ModalTroco.js
import React from 'react';
import './ModalTroco.css'; // Certifique-se de ter um CSS para estilizar o modal

const ModalTroco = ({ isVisible, onClose, onTrocoSubmit, troco, setTroco, handleNoTroco }) => {
    if (!isVisible) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onTrocoSubmit();
    };

    return (
        <>
            <div className="troco__overlay" onClick={onClose}></div>
            <div className="troco__modal-bottom slide-in">
                <div className="troco__modal-content">
                    <h4>Precisa de troco?</h4>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="number"
                            value={troco}
                            onChange={(e) => setTroco(e.target.value)}
                            placeholder="Valor do troco"
                            required
                        />
                        <div className="button-container">
                            <button type="submit">Confirmar</button>
                            <button type="button" className="no-troco-button" onClick={handleNoTroco}>
                                Não precisa de troco
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ModalTroco;
