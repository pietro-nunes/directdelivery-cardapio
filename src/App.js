import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TenantRoutes from "./TenantRoutes";
import { LoadingProvider } from "./contexts/LoadingContext";
import LoadingAnimation from "./components/Loading/LoadingAnimation";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie"; // Importando a biblioteca para manipulação de cookies

const App = () => {
  const [tenantData, setTenantData] = useState(null); // Dados do tenant
  const [cartItems, setCartItems] = useState([]); // Estado do carrinho
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = Cookies.get("token"); // Obtendo o token do cookie
    return !!token;
  });
  const [isRestaurantOpen, setIsRestaurantOpen] = useState(false); // Estado global
  const [lastOrder, setLastOrder] = useState({}); // Estado global

  const handleLogin = (token) => {
    Cookies.set("token", token, { expires: 3 / 24, secure: true }); // Definindo o cookie com expiração de 3 horas
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    Cookies.remove("token"); // Removendo o cookie ao fazer logout
    setIsLoggedIn(false);
  };

  const addToCart = (product) => {
    // 1. Recebemos a quantidade aqui, com padrão 1
    setCartItems((prevItems) => {
      // 2. Criamos uma função auxiliar para ordenar e stringificar de forma segura
      const stringifyOptions = (optionsArray) => {
        if (!optionsArray || optionsArray.length === 0) {
          return "";
        }
        // Ordena o array pelo ID do produto relacionado para garantir consistência
        return JSON.stringify(
          [...optionsArray].sort(
            (a, b) => a.relatedProduct.id - b.relatedProduct.id
          )
        );
      };

      const productKey = `
      ${product.id}-
      ${product.observation || ""}-
      ${stringifyOptions(product.selectedFlavors)}-
      ${stringifyOptions(product.selectedAdditionals)}-
      ${stringifyOptions(product.removedCompositions)}
    `.replace(/\s/g, ""); // Remove espaços e quebras de linha

      const existingItem = prevItems.find(
        (item) => item.uniqueKey === productKey
      );

      if (existingItem) {
        // Se o item já existe, somamos a nova quantidade
        return prevItems.map((item) =>
          item.uniqueKey === productKey
            ? { ...item, count: item.count + product.quantity } // Usamos a 'quantity'
            : item
        );
      }

      // Se é um novo item, adicionamos ao carrinho
      return [
        ...prevItems,
        {
          ...product,
          count: product.quantity, // Usamos a 'quantity' inicial
          uniqueKey: productKey,
        },
      ];
    });
    console.log(cartItems);
  };

  // Recuperando o carrinho do localStorage quando o tenantData é alterado
  useEffect(() => {
    if (tenantData && tenantData.slug) {
      const cartKey = `carrinho-${tenantData.slug}`;

      // Tentando recuperar o carrinho salvo
      const carrinhoSalvo = localStorage.getItem(cartKey);
      if (carrinhoSalvo) {
        setCartItems(JSON.parse(carrinhoSalvo)); // Setando o carrinho com os dados salvos
      }
    }
  }, [tenantData]); // Rodar quando o tenantData for alterado

  // Salvando o carrinho no localStorage sempre que o cartItems mudar
  useEffect(() => {
    if (tenantData && tenantData.slug) {
      const cartKey = `carrinho-${tenantData.slug}`;
      localStorage.setItem(cartKey, JSON.stringify(cartItems)); // Salvar o carrinho no localStorage
    }
  }, [cartItems, tenantData]); // Rodar sempre que cartItems ou tenantData mudarem

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
                tenantData={tenantData}
                setTenantData={setTenantData}
                addToCart={addToCart}
                cartItems={cartItems}
                setCartItems={setCartItems}
                handleLogin={handleLogin}
                handleLogout={handleLogout}
                isLoggedIn={isLoggedIn}
                isRestaurantOpen={isRestaurantOpen}
                setIsRestaurantOpen={setIsRestaurantOpen}
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
