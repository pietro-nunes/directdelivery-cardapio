import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
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
import SafeArea from "./components/SafeArea/SafeArea";

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
  setPaymentData,
}) => {
  const { slug, tableNumber } = useParams();
  const location = useLocation();
  const [isLoadingTenant, setIsLoadingTenant] = useState(true);
  const [hasError, setHasError] = useState(false);

  const isTableMode = !!tableNumber;
  const basePath = isTableMode ? `/${slug}/mesa/${tableNumber}` : `/${slug}`;

  // -----------------------------------------------
  // 0) Gate de polling por rota (Home/Checkout/Cart)
  // -----------------------------------------------
  const pollingEnabled =
    location.pathname === basePath ||
    // location.pathname === `${basePath}/checkout` ||
    location.pathname === `${basePath}/cart`;

  // -------------------------------
  // 1) LER carrinho (tenant + mesa)
  // -------------------------------
  useEffect(() => {
    if (tenantData?.slug) {
      const key = `carrinho-${tenantData.slug}${isTableMode ? `-mesa-${tableNumber}` : ""}`;
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
      const key = `carrinho-${tenantData.slug}${isTableMode ? `-mesa-${tableNumber}` : ""}`;
      localStorage.setItem(key, JSON.stringify(cartItems));
    }
  }, [cartItems, tenantData?.slug, isTableMode, tableNumber]);

  // --------------------------------
  // 3) Buscar dados do tenant (carga inicial)
  // --------------------------------
  const fetchTenantData = async (slugParam) => {
    try {
      const response = await fetch(`${config.baseURL}/tenants/${slugParam}`, { method: "GET" });
      if (!response.ok) throw new Error(`Erro ao buscar tenant: ${response.status}`);
      const tenant = await response.json();
      setTenantData(tenant);
      setHasError(false);
    } catch (error) {
      setTenantData(null);
      setHasError(true);
    } finally {
      setIsLoadingTenant(false);
    }
  };

  // Variante silenciosa para polling (não altera loading/erro)
  const fetchTenantDataSilent = async (slugParam) => {
    try {
      const response = await fetch(`${config.baseURL}/tenants/${slugParam}`, { method: "GET" });
      if (!response.ok) return;
      const tenant = await response.json();
      setTenantData(tenant);
    } catch {
      // silencioso
    }
  };

  // Carga inicial quando o slug muda
  useEffect(() => {
    if (!slug) {
      setHasError(true);
      setIsLoadingTenant(false);
      return;
    }
    setIsLoadingTenant(true);
    fetchTenantData(slug);
  }, [slug]);

  // --------------------------------
  // 4) Polling de heartbeat/tenant (40s) — GATEADO por rota
  // --------------------------------
  const hbIntervalRef = useRef(null);
  useEffect(() => {
    if (!slug) return;

    const clear = () => {
      if (hbIntervalRef.current) {
        clearInterval(hbIntervalRef.current);
        hbIntervalRef.current = null;
      }
    };

    const tick = () => fetchTenantDataSilent(slug);
    const start = () => {
      clear();
      hbIntervalRef.current = setInterval(tick, 40_000);
    };

    if (pollingEnabled) {
      // 1º tick + inicia intervalo
      tick();
      start();
    } else {
      clear();
    }

    const onVisOrFocus = () => {
      if (!pollingEnabled || document.hidden) {
        clear();
      } else {
        tick();
        start();
      }
    };

    document.addEventListener("visibilitychange", onVisOrFocus, { passive: true });
    window.addEventListener("focus", onVisOrFocus, { passive: true });

    return () => {
      clear();
      document.removeEventListener("visibilitychange", onVisOrFocus);
      window.removeEventListener("focus", onVisOrFocus);
    };
  }, [slug, pollingEnabled]);

  // --------------------------------
  // 5) Guards de carregamento/erro
  // --------------------------------
  if (isLoadingTenant) return null;
  if (hasError) return <Navigate to="/" />;
  if (!tenantData) return <Navigate to="/" />;

  // --------------------------------
  // 6) Rotas
  // --------------------------------
  return (
    <SafeArea>
      <Header
        tenantData={tenantData}
        isLoggedIn={isLoggedIn}
        basePath={basePath}
        isTableMode={isTableMode}
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
              isTableMode={isTableMode}
              basePath={basePath}
            />
          }
        />

        <Route
          path="payment"
          element={<PixPayment payment={paymentData} basePath={basePath} />}
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
                onLogin={handleLogin}
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
                isTableMode={isTableMode}
                isLoggedIn={isLoggedIn}
                tenantData={tenantData}
              />
            )
          }
        />
      </Routes>
    </SafeArea>
  );
};

export default TenantRoutes;
