import "./Home.css";
import React, { useEffect, useState, useRef } from "react";
import ProductCard from "../../components/ProductCard/ProductCard";
import Categories from "../../components/Categories/Categories";
import RestaurantInfo from "../../components/RestaurantInfo/RestaurantInfo";
import { useFetchWithLoading } from "../../contexts/fetchWithLoading";
import config from "../../config";
import { toTitleCase } from "../../utils/functions";

const Home = ({ addToCart, tenantData, setIsRestaurantOpen }) => {
  const [selectedCategory, setSelectedCategory] = useState();
  const [categories, setCategories] = useState([]);
  const [isCategoriesSticky, setIsCategoriesSticky] = useState(false); // Novo estado para controlar a aderência
  const { fetchWithLoading } = useFetchWithLoading();

  const restaurantInfoRef = useRef(null); // Ref para a seção de informações do restaurante

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
        // Se a seção de informações do restaurante não estiver mais visível,
        // torna as categorias aderentes (sticky). Caso contrário, desativa.
        setIsCategoriesSticky(!entry.isIntersecting);
      },
      {
        root: null, // Observa em relação à viewport
        rootMargin: '0px',
        threshold: 0.1, // Dispara quando 10% do elemento observado está visível/invisível
      }
    );

    if (restaurantInfoRef.current) {
      observer.observe(restaurantInfoRef.current);
    }

    // Função de limpeza para desconectar o observer ao desmontar o componente
    return () => {
      if (restaurantInfoRef.current) {
        observer.unobserve(restaurantInfoRef.current);
      }
    };
  }, [restaurantInfoRef]); // Depende da ref para re-executar se ela mudar

  // Função para rolar até a categoria selecionada
  const scrollToCategory = (category) => {
    setSelectedCategory(category);
    const categoryElement = document.getElementById(category);
    if (categoryElement) {
      // Ajuste o offset considerando a altura do cabeçalho principal e da barra de categorias quando sticky
      const headerOffset = 80; // Altura do seu header principal (ajuste conforme necessário)
      const categoriesStickyHeight = 55; // Altura aproximada da barra de categorias quando sticky (ajuste conforme necessário)

      const offsetPosition =
        categoryElement.getBoundingClientRect().top +
        window.pageYOffset -
        headerOffset -
        (isCategoriesSticky ? categoriesStickyHeight : 0); // Aplica o offset adicional se estiver sticky

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="home">
      {tenantData && (
        // Wrapper para o RestaurantInfo para podermos observá-lo com a ref
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

      <p>Explore o nosso cardápio:</p>

      {/* Container das categorias com classe condicional para "sticky" */}
      <div className={`categories-wrapper ${isCategoriesSticky ? 'categories-sticky' : ''}`}>
        <Categories
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={scrollToCategory}
        />
      </div>

      {categories.map(
        (category) =>
          category.isActive && (
            <div key={category.id} className="category" id={toTitleCase(category.name)}>
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