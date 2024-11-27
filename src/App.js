import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TenantRoutes from "./TenantRoutes";
import { LoadingProvider } from "./contexts/LoadingContext";
import LoadingAnimation from "./components/Loading/LoadingAnimation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const [cartItems, setCartItems] = useState(() => {
    const carrinhoSalvo = localStorage.getItem("carrinho");
    return carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem("token");
    return !!token;
  });

  const [isRestaurantOpen, setIsRestaurantOpen] = useState(false); // Estado global

  const [lastOrder, setLastOrder] = useState({}); // Estado global

  const handleLogin = (token) => {
    localStorage.setItem("token", token);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const productKey = `${product.id}-${JSON.stringify(product.selectedFlavors)}-${JSON.stringify(product.selectedAdditionals)}`;
      const existingItem = prevItems.find((item) => item.uniqueKey === productKey);

      if (existingItem) {
        return prevItems.map((item) =>
          item.uniqueKey === productKey
            ? { ...item, count: item.count + 1 }
            : item
        );
      }

      return [
        ...prevItems,
        {
          ...product,
          count: 1,
          uniqueKey: productKey,
        },
      ];
    });
  };

  useEffect(() => {
    localStorage.setItem("carrinho", JSON.stringify(cartItems));
  }, [cartItems]);

  return (
    <LoadingProvider>
      <Router>
        <ToastContainer />
        <LoadingAnimation />
        <Routes>
          <Route
            path="/:slug/*"
            element={
              <TenantRoutes
                addToCart={addToCart}
                cartItems={cartItems}
                setCartItems={setCartItems}
                handleLogin={handleLogin}
                handleLogout={handleLogout}
                isLoggedIn={isLoggedIn}
                isRestaurantOpen={isRestaurantOpen}
                setIsRestaurantOpen={setIsRestaurantOpen} // Passa a função para atualizar o estado
                lastOrder={lastOrder}
                setLastOrder={setLastOrder}
              />
            }
          />
        </Routes>
      </Router>
    </LoadingProvider>
  );
};

export default App;
