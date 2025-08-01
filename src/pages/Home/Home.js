// Home.jsx
import "./Home.css";
import React, { useEffect, useState, useRef } from "react";
import ProductCard from "../../components/ProductCard/ProductCard";
import Categories from "../../components/Categories/Categories";
import RestaurantInfo from "../../components/RestaurantInfo/RestaurantInfo";
import BestSellerProductCard from "../../components/BestSellerProductCard/BestSellerProductCard"; // IMPORTANTE: Nova importação
import { useFetchWithLoading } from "../../contexts/fetchWithLoading";
import config from "../../config";
import { toTitleCase } from "../../utils/functions";
import ProductModalMobile from "../../components/ProductModalMobile/ProductModalMobile";

const Home = ({ addToCart, tenantData, setIsRestaurantOpen }) => {
  const [selectedCategory, setSelectedCategory] = useState();
  const [categories, setCategories] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [isCategoriesSticky, setIsCategoriesSticky] = useState(false);
  const { fetchWithLoading } = useFetchWithLoading();
  const [selectedProduct, setSelectedProduct] = useState(null);

  const restaurantInfoRef = useRef(null);

  // Função para buscar as categorias com produtos
  const fetchCategories = async () => {
    try {
      const categoriesResponse = await fetchWithLoading(
        `${config.baseURL}/categories/with-products/${tenantData.id}`
      );
      const categoriesData = await categoriesResponse.json();
      setCategories(categoriesData);
      // Garante que a primeira categoria válida seja selecionada
      setSelectedCategory(toTitleCase(categoriesData[0]?.name));

      const bestSellersResponse = await fetchWithLoading(
        `${config.baseURL}/products/${tenantData.id}/favorites`
      );
      const bestSellersData = await bestSellersResponse.json();
      setBestSellers(bestSellersData);
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

  return (
    <div className="home">
      {tenantData && (
        <div ref={restaurantInfoRef} className="restaurant-info-section">
          <RestaurantInfo
            restaurantInfo={{
              logo: tenantData.logo,
              name: tenantData.legalName,
              openingTime: tenantData.openingTime,
              closingTime: tenantData.closingTime,
              openingTime2: tenantData.openingTime2,
              closingTime2: tenantData.closingTime2,
              openingDays: tenantData.openingDays,
              address: `${tenantData.address}, ${tenantData.number}, ${tenantData.neighborhood} - ${tenantData.city}`,
            }}
            setIsRestaurantOpen={setIsRestaurantOpen}
          />
        </div>
      )}

      {/* Seção de Mais Vendidos */}
      <div className="best-sellers-section">
        <h3 className="section-title">✨ Nossos Queridinhos ✨</h3>
        <p className="section-subtitle">Os que mais fazem sucesso por aqui!</p>
        <div className="best-sellers-carousel">
          {bestSellers.map((product) => (
            <BestSellerProductCard // AGORA USANDO O NOVO COMPONENTE
              key={product.id}
              product={product}
              onClick={() => setSelectedProduct(product)}
              // A prop isBestSeller não é mais necessária aqui, pois é inerente ao componente
            />
          ))}
        </div>
      </div>

      {selectedProduct && (
        <ProductModalMobile
          product={selectedProduct}
          closeModal={() => setSelectedProduct(null)}
          addToCart={addToCart}
          tenantFlavorCalcType={tenantData.flavorCalcType}
        />
      )}

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
                  <ProductCard // Mantém o ProductCard para as demais categorias
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
