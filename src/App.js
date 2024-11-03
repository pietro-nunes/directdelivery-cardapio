import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Cart from "./pages/Cart"; // Importando o componente Cart
import FabButton from "./components/FabButton";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Importa os estilos

function App() {
  const [cartItems, setCartItems] = useState(() => {
    const carrinhoSalvo = localStorage.getItem("carrinho");
    return carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];
  });

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true); // Verifica se o usuário está logado
    }

    localStorage.setItem("carrinho", JSON.stringify(cartItems));
  }, [cartItems]);

  const handleLogin = () => {
    setIsLoggedIn(true); // Atualiza o estado para logado
  };

  const handleLogout = () => {
    setIsLoggedIn(false);  
    const token = localStorage.removeItem("token")
  }

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
          <Route path="/" element={<Home addToCart={addToCart} />} />
          <Route
            path="/cart"
            element={<Cart cartItems={cartItems} setCartItems={setCartItems} />}
          />{" "}
          {/* Rota para o Cart */}
          <Route path="/checkout" element={<Checkout carrinho={cartItems} onLogout={handleLogout} />} />
          <Route
            path="/login"
            element={
              isLoggedIn ? (
                <Navigate to="/checkout" />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
        </Routes>
        <FabButton cartItems={cartItems} />
      </Router>
  );
}

export default App;
