import React, { useState } from "react";
import ProductCard from "../components/ProductCard";
import Categories from "../components/Categories"; // Importa o novo componente de categorias
import "./Home.css";
import RestaurantInfo from "../components/RestaurantInfo";

const Home = ({ addToCart }) => {
  const [selectedCategory, setSelectedCategory] = useState("Bebidas");

  const categories = [
    {
      id: 1,
      name: "Bebidas",
      products: [
        {
          id: 1,
          name: "Refrigerante",
          price: 5.0,
          image: "http://localhost:3000/images/food.jpg",
          description: "Refrigerante gelado.",
        },
        {
          id: 2,
          name: "Suco Natural",
          price: 7.5,
          image: "http://localhost:3000/images/food.jpg",
          description: "Suco natural de frutas.",
        },
      ],
    },
    {
      id: 2,
      name: "Lanches",
      products: [
        {
          id: 3,
          name: "Sanduíche de Frango",
          price: 12.0,
          image: "http://localhost:3000/images/food.jpg",
          description: "Sanduíche com filé de frango.",
          type: "pizza",
          sessions: [
            {
              id: 1,
              title: "Molhos",
              allowed: 3,
              mandatory: 1,
              itens: [
                {
                  id: 1,
                  name: "Kiwi",
                  price: 2,
                },
                {
                  id: 6,
                  name: "Teste",
                },
                {
                  id: 7,
                  name: "Teste2",
                },
              ],
            },
            {
              id: 2,
              title: "Cremes",
              allowed: 1,
              mandatory: 1,
              itens: [
                {
                  id: 4,
                  name: "Creme de Beterraba",
                  price: 5,
                },
                {
                  id: 9,
                  name: "Banana",
                },
              ],
            },
          ],
        },
        {
          id: 4,
          name: "Hambúrguer",
          price: 15.0,
          image: "http://localhost:3000/images/food.jpg",
          description: "Hambúrguer artesanal.",
        },
      ],
    },
    // Adicione mais categorias e produtos conforme necessário...
  ];

  const restaurantInfo = {
    logo: "http://localhost:3000/images/logo.png",
    name: "Restaurante Saboroso",
    hours: "09:00 - 22:00",
    isOpen: true,
  };

  const scrollToCategory = (category) => {
    setSelectedCategory(category);
    const categoryElement = document.getElementById(category); // Certifique-se de que o id corresponda
    if (categoryElement) {
      categoryElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="home">

      <RestaurantInfo restaurantInfo={restaurantInfo}/>

      {/* Listagem de categorias e produtos */}
      <p>Explore nosso cardápio:</p>

      {/* Seção de categorias */}
      <Categories
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={scrollToCategory}
      />

      {categories.map((category) => (
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
      ))}
    </div>
  );
};

export default Home;
