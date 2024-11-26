import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header/Header";
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
      // Identificar o produto com base nas combinações de sabores e adicionais
      const productKey = `${product.id}-${JSON.stringify(product.selectedFlavors)}-${JSON.stringify(product.selectedAdditionals)}`;
      
      // Verificar se o item já existe no carrinho com a mesma combinação
      const existingItem = prevItems.find((item) => item.uniqueKey === productKey);
  
      if (existingItem) {
        // Incrementar a quantidade apenas se a combinação já existir
        return prevItems.map((item) =>
          item.uniqueKey === productKey
            ? { ...item, count: item.count + 1 }
            : item
        );
      }
  
      // Adicionar como um novo item no carrinho, criando uma chave única
      return [
        ...prevItems,
        {
          ...product,
          count: 1,
          uniqueKey: productKey, // Chave única baseada na combinação
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
      <Header />
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
              isLoggedIn={isLoggedIn} // Passa o estado de login como prop
            />
          }
        />
      </Routes>
    </Router>
    </LoadingProvider>
  );
};

export default App;
