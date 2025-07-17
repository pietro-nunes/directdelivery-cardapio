import React, { useRef, useEffect } from "react";
import "./Categories.css";
import { toTitleCase } from "../../utils/functions";

const Categories = ({ categories, selectedCategory, onSelectCategory }) => {
  // A referência 'underlineRef' não será mais necessária, mas pode manter se não atrapalhar outros códigos.
  // const underlineRef = useRef(null); 

  // O useEffect que movia o underline não será mais necessário.
  // useEffect(() => {
  //   const activeCategory = document.querySelector(".category-item.active");
  //   if (activeCategory && underlineRef.current) {
  //     const { offsetLeft, clientWidth } = activeCategory;
  //     underlineRef.current.style.left = `${offsetLeft}px`;
  //     underlineRef.current.style.width = `${clientWidth}px`;
  //   }
  // }, [selectedCategory]);

  return (
    <div className="categories-container">
      {categories.map(
        (category) =>
          category.isActive && (
            <div
              key={category.id}
              className={`category-item ${
                selectedCategory === toTitleCase(category.name) ? "active" : ""
              }`}
              onClick={() => onSelectCategory(toTitleCase(category.name))}
            >
              {toTitleCase(category.name)}
            </div>
          )
      )}
      {/* REMOVIDO: <div className="underline" ref={underlineRef}></div> */} {/* Esta linha será removida */}
    </div>
  );
};

export default Categories;