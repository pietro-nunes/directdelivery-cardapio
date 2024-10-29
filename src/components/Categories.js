import React, { useRef, useEffect } from "react";
import "./Categories.css"; // Estilos atualizados

const Categories = ({ categories, selectedCategory, onSelectCategory }) => {
  const underlineRef = useRef(null); // Referência para o underline

  useEffect(() => {
    const activeCategory = document.querySelector('.category-item.active'); // Seleciona a categoria ativa
    if (activeCategory && underlineRef.current) {
      const { offsetLeft, clientWidth } = activeCategory; // Posição e largura do item ativo
      underlineRef.current.style.left = `${offsetLeft}px`; // Ajusta a posição do underline
      underlineRef.current.style.width = `${clientWidth}px`; // Ajusta a largura do underline
    }
  }, [selectedCategory]); // Atualiza sempre que a categoria selecionada mudar

  return (
    <div className="categories-container">
      {categories.map((category) => (
        <div
          key={category.id}
          className={`category-item ${selectedCategory === category.name ? "active" : ""}`}
          onClick={() => onSelectCategory(category.name)}
        >
          {category.name}
        </div>
      ))}
      <div className="underline" ref={underlineRef}></div> {/* Linha embaixo da categoria ativa */}
    </div>
  );
};

export default Categories;
