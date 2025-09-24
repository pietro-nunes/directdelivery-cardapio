import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import Home from "./pages/Home/Home";
import Cart from "./pages/Cart/Cart";
import Header from "./components/Header/Header";
import Checkout from "./pages/Checkout/Checkout";
import FabButton from "./components/FabButton/FabButton";
import Login from "./pages/Login/Login";
import config from "./config";
import FabButtonWhats from "./components/FabButtonWhats/FabButtonWhats";
import OrdersList from "./pages/OrdersList/OrdersList";
import OrderCompleted from "./pages/OrderCompleted/OrderCompleted";
import PixPayment from "./pages/PixPayment/PixPayment";

const TenantRoutes = ({
  tenantData,
  setTenantData,
  addToCart,
  cartItems,
  setCartItems,
  handleLogin,
  handleLogout,
  isLoggedIn,
  setIsRestaurantOpen,
  isRestaurantOpen,
  lastOrder,
  setLastOrder,
  paymentData,
  setPaymentData
}) => {
  const { slug, tableNumber } = useParams();
  const [isLoadingTenant, setIsLoadingTenant] = useState(true); // Estado de carregamento
  const [hasError, setHasError] = useState(false); // Flag para erro de carregamento
  const isTableMode = !!tableNumber;
  const basePath = isTableMode ? `/${slug}/mesa/${tableNumber}` : `/${slug}`;
  // -------------------------------
  // 1) LER carrinho (tenant + mesa)
  // -------------------------------
  useEffect(() => {
    if (tenantData?.slug) {
      const key = `carrinho-${tenantData.slug}${
        isTableMode ? `-mesa-${tableNumber}` : ""
      }`;
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          setCartItems(JSON.parse(raw));
        } else {
          setCartItems([]);
        }
      } catch {
        localStorage.removeItem(key);
        setCartItems([]);
      }
    }
  }, [tenantData?.slug, isTableMode, tableNumber, setCartItems]);

  // --------------------------------
  // 2) GRAVAR carrinho (tenant+mesa)
  // --------------------------------
  useEffect(() => {
    if (tenantData?.slug) {
      const key = `carrinho-${tenantData.slug}${
        isTableMode ? `-mesa-${tableNumber}` : ""
      }`;
      try {
        localStorage.setItem(key, JSON.stringify(cartItems));
      } catch {}
    }
  }, [cartItems, tenantData?.slug, isTableMode, tableNumber]);

  // Função para buscar os dados do tenant
  const fetchTenantData = async (slug) => {
    try {
      // console.log(`[INFO] Buscando tenant para o slug: ${slug}`);
      const response = await fetch(`${config.baseURL}/tenants/${slug}`, {
        method: "GET",
      });
      if (!response.ok) {
        console.error(`[ERROR] API retornou status ${response.status}`);
        throw new Error(`Erro ao buscar tenant: ${response.status}`);
      }
      const tenant = await response.json();
      // console.log("[SUCCESS] Tenant encontrado:", tenant);
      setTenantData(tenant);
      setHasError(false); // Resetar o estado de erro
    } catch (error) {
      console.error("[ERROR] Erro ao buscar tenant:", error.message);
      setTenantData(null); // Resetar tenantData
      setHasError(true);
    } finally {
      setIsLoadingTenant(false); // Finalizar o carregamento
    }
  };

  // Efeito para buscar o tenant quando o slug muda
  useEffect(() => {
    if (!slug) {
      console.error("[ERROR] Slug não encontrado na URL.");
      setHasError(true);
      setIsLoadingTenant(false);
      return;
    }
    setIsLoadingTenant(true); // Inicia o carregamento
    fetchTenantData(slug);
  }, [slug]);

  // Enquanto o tenant está carregando
  if (isLoadingTenant) {
    // console.log("[INFO] Carregando dados do tenant...");
    return null;
  }

  // Se houve erro ao carregar os dados
  if (hasError) {
    console.error("[ERROR] Tenant não encontrado. Redirecionando para '/'...");
    return <Navigate to="/" />;
  }

  // Renderizar as rotas se o tenant foi carregado com sucesso
  if (!tenantData) {
    console.error("[ERROR] Tenant não carregado ou inválido.");
    return <Navigate to="/" />;
  }

  // console.log("[SUCCESS] Tenant carregado com sucesso:", tenantData);

  return (
    <>
      <Header
        tenantData={tenantData}
        isLoggedIn={isLoggedIn}
        basePath={basePath}
      />
      <FabButtonWhats
        tenantData={tenantData}
        message={"Olá! Gostaria que me enviasse o cardápio."}
        isTableMode={isTableMode}
      />
      <FabButton cartItems={cartItems} basePath={basePath} />
      <Routes>
        <Route
          path="/"
          element={
            <Home
              tenantData={tenantData}
              addToCart={addToCart}
              setIsRestaurantOpen={setIsRestaurantOpen}
            />
          }
        />
        <Route path="orders" element={<OrdersList tenantData={tenantData} />} />
        <Route
          path="orderCompleted"
          element={
            <OrderCompleted
              tenantData={tenantData}
              orderDetails={lastOrder}
              sendWhatsApp
            />
          }
        />
        <Route
          path="payment"
          element={
            <PixPayment
              payment={paymentData}
            />
          }
        />
        <Route
          path="cart"
          element={
            <Cart
              basePath={basePath}
              cartItems={cartItems}
              setCartItems={setCartItems}
              isLoggedIn={isLoggedIn}
              isRestaurantOpen={isRestaurantOpen}
            />
          }
        />
        <Route
          path="checkout"
          element={
            !isLoggedIn || !isRestaurantOpen ? (
              <Navigate to={basePath} />
            ) : (
              <Checkout
                cartItems={cartItems}
                setCartItems={setCartItems}
                tenantData={tenantData}
                onLogout={handleLogout}
                setLastOrder={setLastOrder}
                tableNumber={tableNumber}
                isTableMode={isTableMode}
                setPaymentData={setPaymentData}
                basePath={basePath}
              />
            )
          }
        />
        <Route
          path="login"
          element={
            isLoggedIn ? (
              <Navigate to={`${basePath}/checkout`} />
            ) : (
              <Login
                basePath={basePath}
                onLogin={handleLogin}
                isLoggedIn={isLoggedIn}
              />
            )
          }
        />
      </Routes>
    </>
  );
};

export default TenantRoutes;
