import React, { useEffect, useRef } from 'react';
import './ModalTroco.css';

const ModalTroco = ({ isVisible, onClose, onTrocoSubmit, troco, setTroco, handleNoTroco }) => {
    const inputRef = useRef(null);

    useEffect(() => {
        if (isVisible && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isVisible]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onTrocoSubmit();
    };

    const formatCurrency = (value) => {
        const numericValue = value.replace(/\D/g, '');
        if (numericValue === '') return '';

        let floatValue = parseFloat(numericValue) / 100;

        // Limitar até R$ 99.000,00
        if (floatValue > 99000) {
            floatValue = 99000;
        }

        return floatValue.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        });
    };

    const handleChange = (e) => {
        const formatted = formatCurrency(e.target.value);
        setTroco(formatted);
    };

    if (!isVisible) return null;

    return (
        <>
            <div className="troco__overlay" onClick={onClose}></div>
            <div className="troco__modal-bottom slide-in">
                <div className="troco__modal-content">
                    <h4>Precisa de troco?</h4>
                    <form onSubmit={handleSubmit}>
                        <label>Informe o valor do troco:</label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={troco}
                            onChange={handleChange}
                            placeholder="R$ 0,00"
                        />
                        <div className="button-container">
                            <button type="submit">Confirmar</button>
                            <button type="button" id="no-troco-button" onClick={handleNoTroco}>
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
