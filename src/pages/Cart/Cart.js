import React from "react";
import { useNavigate } from "react-router-dom";
import "./Cart.css";
import config from "../../config";
import { toast, Bounce } from "react-toastify";
import { formatarNumero, toTitleCase } from "../../utils/functions";

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
    <>
      <div className="cart">
        <h2 className="cart-title">Seu Carrinho</h2> {/* Adicionada classe para o título */}
        {cartItems.length === 0 ? (
          <p className="cart-empty-message">Seu carrinho está vazio.</p>
        ) : (
          <>
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
                    <p className="cart-item-name">{toTitleCase(item.name)}</p>

                    {item.selectedFlavors?.length > 0 && ( // Sabores primeiro, geralmente mais importantes
                      <div className="cart-item-info-block">
                        <p className="cart-item-info-title">Sabores:</p>
                        <ul className="cart-item-list">
                          {item.selectedFlavors.map((flavor, index) => (
                            <li key={index}>{toTitleCase(flavor.relatedProduct.name)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.selectedAdditionals?.length > 0 && (
                      <div className="cart-item-info-block">
                        <p className="cart-item-info-title">Adicionais:</p>
                        <ul className="cart-item-list">
                          {item.selectedAdditionals.map((additional, index) => (
                            <li key={index}>
                              {toTitleCase(additional.relatedProduct.name)} (+ R$ {formatarNumero(additional.price)})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.removedCompositions?.length > 0 && (
                      <div className="cart-item-info-block">
                        <p className="cart-item-info-title">Removidos:</p>
                        <ul className="cart-item-list removed-compositions-list"> {/* Adiciona classe para estilo */}
                          {item.removedCompositions.map((composition, index) => (
                            <li key={index}>{toTitleCase(composition.relatedProduct.name)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.observation && (
                      <div className="cart-item-info-block">
                        <p className="cart-item-info-title">Observação:</p>
                        <p className="cart-item-obs">{item.observation}</p>
                      </div>
                    )}

                    <div className="quantity-controls">
                      <p className="cart-item-price">
                        R$ {formatarNumero(item.totalPrice * item.count)} {/* Mostra o preço total do item * quantidade */}
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
            </div>
            {/* O cart-summary e o botão de checkout foram separados no layout */}
          </>
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="cart-fixed-footer">
          <div className="cart-summary-fixed"> {/* Novo div para o resumo dentro do footer */}
            <p className="total-label">Total do carrinho:</p>
            <p className="total-amount">R$ {formatarNumero(calculateTotal())}</p>
          </div>
          <button
            className="checkout-button"
            onClick={handleProceedToCheckout}
          >
            Prosseguir para finalização
          </button>
        </div>
      )}
    </>
  );
};

export default Cart;