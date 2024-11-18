import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Cart.css';
import config from '../../config';

const Cart = ({ cartItems, setCartItems, isLoggedIn, tenantData }) => {
    const navigate = useNavigate();

    const handleIncrement = (id) => {
        setCartItems((prevItems) => 
            prevItems.map(item =>
                item.id === id ? { ...item, count: item.count + 1 } : item
            )
        );
    };

    const handleDecrement = (id) => {
        setCartItems((prevItems) => {
            const itemToRemove = prevItems.find(item => item.id === id);
            if (itemToRemove.count > 1) {
                return prevItems.map(item =>
                    item.id === id ? { ...item, count: item.count - 1 } : item
                );
            } else {
                return prevItems.filter(item => item.id !== id);
            }
        });
    };

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => total + item.price * item.count, 0).toFixed(2);
    };

    const handleProceedToCheckout = () => {
        if (isLoggedIn) {
            navigate(`/${tenantData.slug}/checkout`);
        } else {
            navigate(`/${tenantData.slug}/login`);
        }
    };

    console.log(tenantData);
    return (
        <div className="cart">
            <h2>Seu Carrinho</h2>
            {cartItems.length === 0 ? (
                <p>Seu carrinho está vazio.</p>
            ) : (
                <div className="cart-items">
                    {cartItems.map(item => (
                        <div key={item.id} className="cart-item">
                            <img src={config.baseURL + item.image} alt={item.name} className="cart-item-image" />
                            <div className="item-details">
                                <p className="cart-item-name">{item.name}</p>
                                <p className="cart-item-obs"> {item.observation &&  `Obs: ${item.observation}`}</p>
                                <div className="quantity-controls">
                                <p className="cart-item-price">R$ {item.price}</p>
                                    <div className="quantity-control">
                                        <button className="decrement-button" onClick={() => handleDecrement(item.id)}>-</button>
                                        <span className="quantity-display">{item.count}</span>
                                        <button className="increment-button" onClick={() => handleIncrement(item.id)}>+</button>
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
