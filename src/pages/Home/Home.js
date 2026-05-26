import "./Home.css";
import React, { useEffect, useState, useRef } from "react";
import ProductCard from "../../components/ProductCard/ProductCard";
import Categories from "../../components/Categories/Categories";
import RestaurantInfo, { getActiveTurn } from "../../components/RestaurantInfo/RestaurantInfo";
import BestSellerProductCard from "../../components/BestSellerProductCard/BestSellerProductCard";
import SearchBar from "../../components/SearchBar/SearchBar";
import SearchResults from "../../components/SearchResults/SearchResults";
import { useFetchWithLoading } from "../../contexts/fetchWithLoading";
import config from "../../config";
import { toTitleCase } from "../../utils/functions";
import { searchProducts, getAllProducts } from "../../utils/searchUtils";
import ProductModalMobile from "../../components/ProductModalMobile/ProductModalMobile";
import WhatsAppContact from "../../components/WhatsAppContact/WhatsAppContact";

const Home = ({ addToCart, tenantData, setIsRestaurantOpen, isTableMode, cart }) => {
  const [selectedCategory, setSelectedCategory] = useState();
  const [categories, setCategories] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [isCategoriesSticky, setIsCategoriesSticky] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { fetchWithLoading } = useFetchWithLoading();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showInactivityAlert, setShowInactivityAlert] = useState(false);

  const restaurantInfoRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const alertShownRef = useRef(false);

  // Função para resetar o timer de inatividade
  const resetInactivityTimer = () => {
    // Limpa o timer existente
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Reseta o flag do alerta quando há atividade
    alertShownRef.current = false;

    // Só inicia o timer se houver itens no carrinho
    if (cart && cart.length > 0) {
      inactivityTimerRef.current = setTimeout(() => {
        // Só mostra o alerta se ainda não foi mostrado
        if (!alertShownRef.current) {
          setShowInactivityAlert(true);
          alertShownRef.current = true;
        }
      }, 20000); // 10 segundos
    }
  };

  // Effect para monitorar atividade do usuário
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Adiciona os listeners para todos os eventos
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });

    // Inicia o timer na montagem do componente
    resetInactivityTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [cart]); // Reexecuta quando o carrinho muda

  // Função para fechar o alerta
  const closeInactivityAlert = () => {
    setShowInactivityAlert(false);
    resetInactivityTimer();
  };

  // Função para buscar as categorias com produtos
  const fetchCategories = async () => {
    try {
      const categoriesResponse = await fetchWithLoading(
        `${config.baseURL}/categories/with-products/${tenantData.id}?currentTurn=true`
      );
      const categoriesData = await categoriesResponse.json();
      setCategories(categoriesData);
      // Garante que a primeira categoria válida seja selecionada
      setSelectedCategory(toTitleCase(categoriesData[0]?.name));

      const bestSellersResponse = await fetchWithLoading(
        `${config.baseURL}/products/${tenantData.id}/favorites`
      );
      const bestSellersData = await bestSellersResponse.json();

      const now = new Date();
      const currentDay = now.getDay() === 0 ? 1 : now.getDay() + 1;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const activeTurn = getActiveTurn(tenantData.turns, currentDay, currentMinutes);

      const filtered = activeTurn
        ? bestSellersData.filter(p =>
            p.productTurns?.some(pt => pt.turnId === activeTurn.id)
          )
        : bestSellersData;

      setBestSellers(filtered);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  // Carregar categorias quando os dados do tenant estiverem prontos
  useEffect(() => {
    if (tenantData) {
      fetchCategories();
    }
  }, [tenantData]);

  // Efeito para o IntersectionObserver que controla a aderência das categorias
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCategoriesSticky(!entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      }
    );

    if (restaurantInfoRef.current) {
      observer.observe(restaurantInfoRef.current);
    }

    return () => {
      if (restaurantInfoRef.current) {
        observer.unobserve(restaurantInfoRef.current);
      }
    };
  }, [restaurantInfoRef]);

  // Função para rolar até a categoria selecionada
  const scrollToCategory = (category) => {
    setSelectedCategory(category);
    const categoryElement = document.getElementById(category);
    if (categoryElement) {
      const headerOffset = 80;
      const categoriesStickyHeight = 55;

      const offsetPosition =
        categoryElement.getBoundingClientRect().top +
        window.pageYOffset -
        headerOffset -
        (isCategoriesSticky ? categoriesStickyHeight : 0);

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // Lógica de busca
  const allProducts = getAllProducts(categories);
  const searchedProducts = searchProducts(allProducts, searchTerm);

  return (
    <div className="home">
      {/* Alerta de Inatividade */}
      {showInactivityAlert && (
        <div className="inactivity-alert-overlay" onClick={closeInactivityAlert}>
          <div className="inactivity-alert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inactivity-alert-icon">⚠️</div>
            <h3>Seu pedido ainda não foi enviado!</h3>
            <p>Você tem itens no carrinho que ainda não foram finalizados.</p>
            <p className="alert-reminder">Não esqueça de concluir seu pedido! 😊</p>
            <button className="alert-close-btn" onClick={closeInactivityAlert}>
              Entendi
            </button>
          </div>
        </div>
      )}

      {tenantData && (
        <div ref={restaurantInfoRef} className="restaurant-info-section">
          <RestaurantInfo
            restaurantInfo={{
              logo: tenantData.logo,
              name: tenantData.tradeName,
              turns: tenantData.turns,
              address: tenantData.address,
              number: tenantData.number,
              neighborhood: tenantData.neighborhood,
              city: tenantData.city,
              lastPooling: tenantData.lastPooling,
              deliveryEnabled: tenantData.deliveryEnabled,
              pickupEnabled: tenantData.pickupEnabled,
              eatHereEnabled: tenantData.eatHereEnabled,
              onlyWithdraw: tenantData.onlyWithdraw,
            }}
            setIsRestaurantOpen={setIsRestaurantOpen}
            isTableMode={isTableMode}
          />
        </div>
      )}

      {tenantData && (
        <WhatsAppContact
          tenantData={tenantData}
          message={"Olá!! Gostaria que me enviasse o cardápio."}
        />
      )}

      {/* Seção de Mais Vendidos */}
      {bestSellers.length > 0 && (
        <div className="best-sellers-section">
          <h3 className="section-title">✨ Nossos Queridinhos ✨</h3>
          <p className="section-subtitle">Os que mais fazem sucesso por aqui!</p>
          <div className="best-sellers-carousel">
            {bestSellers.map((product) => (
              <BestSellerProductCard
                key={product.id}
                product={product}
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        </div>
      )}

      {selectedProduct && (
        <ProductModalMobile
          product={selectedProduct}
          closeModal={() => setSelectedProduct(null)}
          addToCart={addToCart}
          tenantFlavorCalcType={tenantData.flavorCalcType}
          fromFavorites
        />
      )}

      {categories.some(c => c.isActive) && (
        <>
          <p className="explore-menu-text">Explore nosso cardápio completo:</p>

          <div
            className={`categories-wrapper ${
              isCategoriesSticky ? "categories-sticky" : ""
            }`}
          >
            <Categories
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={scrollToCategory}
            />
          </div>

          {/* Barra de Busca */}
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            resultsCount={searchedProducts.length}
          />
        </>
      )}

      {/* Resultados da Busca */}
      {searchTerm && (
        <SearchResults products={searchedProducts}>
          {(product) => (
            <ProductCard
              product={product}
              addToCart={addToCart}
              tenantFlavorCalcType={tenantData.flavorCalcType}
            />
          )}
        </SearchResults>
      )}

      {categories.map(
        (category) =>
          category.isActive && (
            <div
              key={category.id}
              className="category"
              id={toTitleCase(category.name)}
            >
              <h3 className="category-title">{toTitleCase(category.name)}</h3>
              <div className="product-list">
                {category.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    addToCart={addToCart}
                    tenantFlavorCalcType={tenantData.flavorCalcType}
                  />
                ))}
              </div>
            </div>
          )
      )}
    </div>
  );
};

export default Home;