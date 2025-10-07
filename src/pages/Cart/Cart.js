import React from "react";
import { useNavigate } from "react-router-dom";
import "./Cart.css";
import config from "../../config";
import { toast, Bounce } from "react-toastify";
import { formatarNumero, toTitleCase } from "../../utils/functions";
import Lottie from "lottie-react";
import EmptyAnimation from "../../lottie/empty.json";

const Cart = ({
  cartItems,
  setCartItems,
  isLoggedIn,
  basePath,
  isRestaurantOpen,
}) => {
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
        const itemTotal = item.unitPrice * item.count;
        return total + itemTotal;
      }, 0)
      .toFixed(2);
  };

  const handleProceedToCheckout = () => {
    if (!isRestaurantOpen) {
      toast.warn(
        "A loja está fechada no momento. Tente novamente mais tarde.",
        {
          theme: "colored",
          transition: Bounce,
        }
      );
      return;
    }

    if (isLoggedIn) {
      navigate(`${basePath}/checkout`);
    } else {
      navigate(`${basePath}/login`);
    }
  };

  const handleAddMoreItens = () => {
    navigate(`${basePath}`);
  };

  return (
    <>
      <div className="cart">
        {cartItems.length === 0 ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <p className="cart-empty-message">Seu carrinho está vazio.</p>
            <Lottie
              animationData={EmptyAnimation}
              loop={true}
              style={{
                width: 300,
                height: 300,
                marginBottom: "10px",
                margin: "0 auto",
              }}
            />
            <button
              type="button"
              className="confirm-button"
              onClick={() => navigate(`${basePath}`)}
            >
              Começar compra
            </button>
          </div>
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

                    {item.selectedFlavors?.length > 0 && (
                      <div className="cart-item-info-block">
                        <p className="cart-item-info-title">Sabores:</p>
                        <ul className="cart-item-list">
                          {item.selectedFlavors.map((flavor, index) => (
                            <li key={index}>
                              {toTitleCase(flavor.relatedProduct.name)}
                            </li>
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
                              {toTitleCase(additional.relatedProduct.name)} (+
                              R$ {formatarNumero(additional.price)})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.removedCompositions?.length > 0 && (
                      <div className="cart-item-info-block">
                        <p className="cart-item-info-title">Removidos:</p>
                        <ul className="cart-item-list removed-compositions-list">
                          {item.removedCompositions.map(
                            (composition, index) => (
                              <li key={index}>
                                {toTitleCase(composition.relatedProduct.name)}
                              </li>
                            )
                          )}
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
                      <div className="cart-item-price-block">
                        <p className="cart-item-price-total">
                          R$ {formatarNumero(item.unitPrice * item.count)}
                        </p>
                        {item.count > 1 && (
                          <span className="cart-item-price-unit">
                            (R$ {formatarNumero(item.unitPrice)} / cada)
                          </span>
                        )}
                      </div>

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
          </>
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="cart-fixed-footer">
          <div className="cart-summary-fixed">
            <p className="total-label">Total do carrinho:</p>
            <p className="total-amount">
              R$ {formatarNumero(calculateTotal())}
            </p>
          </div>
          <div className="cart-buttons-row">
            <button className="checkout-button" onClick={handleAddMoreItens}>
              Adicionar mais itens
            </button>
            <button className="checkout-button" onClick={handleProceedToCheckout}>
              Prosseguir para finalização
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Cart;
