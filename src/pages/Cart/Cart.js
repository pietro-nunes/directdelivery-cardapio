import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Cart.css';
import config from '../../config';

const Cart = ({ cartItems, setCartItems, isLoggedIn, tenantData }) => {
    const navigate = useNavigate();

    const handleIncrement = (uniqueKey) => {
        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.uniqueKey === uniqueKey ? { ...item, count: item.count + 1 } : item
            )
        );
    };

    const handleDecrement = (uniqueKey) => {
        setCartItems((prevItems) => {
            const itemToRemove = prevItems.find((item) => item.uniqueKey === uniqueKey);
            if (itemToRemove.count > 1) {
                return prevItems.map((item) =>
                    item.uniqueKey === uniqueKey ? { ...item, count: item.count - 1 } : item
                );
            } else {
                return prevItems.filter((item) => item.uniqueKey !== uniqueKey);
            }
        });
    };

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => {
            const itemTotal = item.totalPrice * item.count; // Preço total do item considerando a quantidade
            return total + itemTotal;
        }, 0).toFixed(2); // Formatar para duas casas decimais
    };

    const handleProceedToCheckout = () => {
        if (isLoggedIn) {
            navigate(`/${tenantData.slug}/checkout`);
        } else {
            navigate(`/${tenantData.slug}/login`);
        }
    };

    return (
        <div className="cart">
            <h2>Seu Carrinho</h2>
            {cartItems.length === 0 ? (
                <p>Seu carrinho está vazio.</p>
            ) : (
                <div className="cart-items">
                    {cartItems.map((item) => (
                        <div key={item.uniqueKey} className="cart-item">
                            <img
                                src={config.baseURL + item.image}
                                alt={item.name}
                                className="cart-item-image"
                            />
                            <div className="item-details">
                                <p className="cart-item-name">{item.name}</p>

                                {/* Exibir Sabores */}
                                {item.selectedFlavors?.length > 0 && (
                                    <p className="cart-item-flavors">
                                        <strong>Sabores:</strong>{" "}
                                        {item.selectedFlavors
                                            .map((flavor) => flavor.relatedProduct.name)
                                            .join(", ")}
                                    </p>
                                )}

                                {/* Exibir Adicionais */}
                                {item.selectedAdditionals?.length > 0 && (
                                    <p className="cart-item-additionals">
                                        <strong>Adicionais:</strong>{" "}
                                        {item.selectedAdditionals
                                            .map(
                                                (additional) =>
                                                    `${additional.relatedProduct.name} (R$ ${parseFloat(
                                                        additional.price
                                                    ).toFixed(2)})`
                                            )
                                            .join(", ")}
                                    </p>
                                )}

                                {/* Observações */}
                                {item.observation && (
                                    <p className="cart-item-obs">
                                        <strong>Obs:</strong> {item.observation}
                                    </p>
                                )}

                                <div className="quantity-controls">
                                    <p className="cart-item-price">
                                        R$ {item.totalPrice.toFixed(2)}
                                    </p>
                                    <div className="quantity-control">
                                        <button
                                            className="decrement-button"
                                            onClick={() => handleDecrement(item.uniqueKey)}
                                        >
                                            -
                                        </button>
                                        <span className="quantity-display">{item.count}</span>
                                        <button
                                            className="increment-button"
                                            onClick={() => handleIncrement(item.uniqueKey)}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="cart-summary">
                        <h3>Total: R$ {calculateTotal()}</h3>
                        <button className="checkout-button" onClick={handleProceedToCheckout}>
                            Prosseguir para finalização
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
