import React from "react";
import { useNavigate } from "react-router-dom";
import "./Cart.css";
import config from "../../config";
import { toast, Bounce } from "react-toastify";
import { formatarNumero } from "../../utils/functions";

const Cart = ({ cartItems, setCartItems, isLoggedIn, tenantData, isRestaurantOpen }) => {
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
      const itemToRemove = prevItems.find(
        (item) => item.uniqueKey === uniqueKey
      );
      if (itemToRemove.count > 1) {
        return prevItems.map((item) =>
          item.uniqueKey === uniqueKey
            ? { ...item, count: item.count - 1 }
            : item
        );
      } else {
        return prevItems.filter((item) => item.uniqueKey !== uniqueKey);
      }
    });
  };

  const calculateTotal = () => {
    return cartItems
      .reduce((total, item) => {
        const itemTotal = item.totalPrice * item.count;
        return total + itemTotal;
      }, 0)
      .toFixed(2);
  };

  const handleProceedToCheckout = () => {
    if (!isRestaurantOpen) {
      toast.warn("A loja está fechada no momento. Tente novamente mais tarde.", {
        theme: "colored",
        transition: Bounce,
      });
      return;
    }

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
                className="cart-item-image"
                src={
                  item.image
                    ? `${config.baseURL}${item.image}`
                    : "/images/pizza_placeholder.png"
                }
                alt={item.name || "Placeholder"}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/images/pizza_placeholder.png";
                }}
              />
              <div className="item-details">
                <p className="cart-item-name">{item.name}</p>
                {item.removedCompositions?.length > 0 && (
                  <div className="cart-item-flavors">
                    <strong>Composições removidas:</strong>
                    <ul>
                      {item.removedCompositions.map((composition, index) => (
                        <li key={index}>{composition.relatedProduct.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.selectedFlavors?.length > 0 && (
                  <div className="cart-item-flavors">
                    <strong>Sabores:</strong>
                    <ul>
                      {item.selectedFlavors.map((flavor, index) => (
                        <li key={index}>{flavor.relatedProduct.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.selectedAdditionals?.length > 0 && (
                  <div className="cart-item-additionals">
                    <strong>Adicionais:</strong>
                    <ul>
                      {item.selectedAdditionals.map((additional, index) => (
                        <li key={index}>
                          {additional.relatedProduct.name} (R$ {formatarNumero(additional.price)})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {item.observation && (
                  <p className="cart-item-obs">
                    <strong>Obs:</strong> {item.observation}
                  </p>
                )}
                <div className="quantity-controls">
                  <p className="cart-item-price">
                    R$ {formatarNumero(item.totalPrice)}
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
            <h3>Total: R$ {formatarNumero(calculateTotal())}</h3>
            <button
              className="checkout-button"
              onClick={handleProceedToCheckout}
            >
              Prosseguir para finalização
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
