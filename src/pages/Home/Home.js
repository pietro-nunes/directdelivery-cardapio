import "./Home.css";
import React, { useEffect, useState } from "react";
import ProductCard from "../../components/ProductCard/ProductCard";
import Categories from "../../components/Categories/Categories";
import RestaurantInfo from "../../components/RestaurantInfo/RestaurantInfo";
import { useFetchWithLoading } from "../../contexts/fetchWithLoading";

const Home = ({ addToCart, tenantData, setIsRestaurantOpen }) => {
  const [selectedCategory, setSelectedCategory] = useState();
  const [categories, setCategories] = useState([]); // Estado para armazenar categorias e produtos
  const { fetchWithLoading } = useFetchWithLoading();

  // Função para buscar as categorias com produtos
  const fetchCategories = async () => {
    try {
      const categoriesResponse = await fetchWithLoading(
        `http://localhost:3333/categories/with-products/${tenantData.id}`
      );
      const categoriesData = await categoriesResponse.json();
      setCategories(categoriesData);
      setSelectedCategory(categoriesData[0]?.name);
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

  const scrollToCategory = (category) => {
    setSelectedCategory(category);
    const categoryElement = document.getElementById(category);
    if (categoryElement) {
      categoryElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="home">
      {tenantData && (
        <RestaurantInfo
          restaurantInfo={{
            logo: tenantData.logo,
            name: tenantData.legalName,
            openingTime: tenantData.openingTime,
            closingTime: tenantData.closingTime,
            openingDays: tenantData.openingDays,
          }}
          setIsRestaurantOpen={setIsRestaurantOpen}
        />
      )}

      <p>Explore o nosso cardápio:</p>

      <Categories
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={scrollToCategory}
      />

      {categories.map(
        (category) =>
          category.isActive && (
            <div key={category.id} className="category" id={category.name}>
              <h3 className="category-title">{category.name}</h3>
              <div className="product-list">
                {category.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    addToCart={addToCart}
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
