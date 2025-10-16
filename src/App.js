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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRestaurantOpen, setIsRestaurantOpen] = useState(false); // Estado global
  const [lastOrder, setLastOrder] = useState({}); // Estado global
  const [paymentData, setPaymentData] = useState({}); // Estado global

  // 2) Quando o tenant carregar, verifica o cookie do token
  useEffect(() => {
    if (tenantData?.slug) {
      const token = Cookies.get(`token-${tenantData.slug}`);
      setIsLoggedIn(!!token);
    }
  }, [tenantData?.slug]);

  const handleLogin = (token) => {
    Cookies.set(`token-${tenantData.slug}`, token, {
      expires: 5 / 24,
      secure: true,
    }); // Definindo o cookie com expiração de 3 horas
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    Cookies.remove(`token-${tenantData.slug}`); // Removendo o cookie ao fazer logout
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
  };

  return (
    <LoadingProvider>
      <Router>
        <ToastContainer />
        {/* <LoadingAnimation /> */}
        <Routes>
          {/* modo cardápio digital (como já existe) */}
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
                paymentData={paymentData}
                setPaymentData={setPaymentData}
                /* sem mesa */
              />
            }
          />

          {/* modo mesa */}
          <Route
            path="/:slug/mesa/:tableNumber/*"
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
                /* agora com mesa via params em TenantRoutes */
              />
            }
          />
        </Routes>
      </Router>
    </LoadingProvider>
  );
};

export default App;
