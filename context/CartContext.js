// context/CartContext.js
import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  function addToCart(product) {
    setItems((prev) => {
      const index = prev.findIndex(p => p.id === product.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index].qty += 1;
        return updated;
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }

  const removeFromCart = (productId) => {
    setItems((prevItems) => {
      const updated = prevItems.map((item) =>
        item.id === productId ? { ...item, qty: item.qty - 1 } : item
      );
  
      return updated.filter((item) => item.qty > 0);
    });
  };

  function clearCart() {
    setItems([]);
  }

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
