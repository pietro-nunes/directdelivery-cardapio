import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header/Header";
import TenantRoutes from "./TenantRoutes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const [cartItems, setCartItems] = useState(() => {
    const carrinhoSalvo = localStorage.getItem("carrinho");
    return carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];
  });

  // Verifica no localStorage se o token está presente
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem("token");
    return !!token; // Define true se o token existe, caso contrário false
  });

  const handleLogin = (token) => {
    localStorage.setItem("token", token); // Salva o token no localStorage
    setIsLoggedIn(true); // Atualiza o estado para logado
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove o token do localStorage
    setIsLoggedIn(false); // Atualiza o estado para deslogado
  };

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, count: item.count + 1 } : item
        );
      }
      return [...prevItems, { ...product, count: 1 }];
    });
  };

  return (
    <Router>
      <ToastContainer />
      <Header />
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
              isLoggedIn={isLoggedIn} // Passa o estado de login como prop
            />
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
