import React, { createContext, useContext, useEffect, useState } from "react";

const CategoryContext = createContext();

export function CategoryProvider({ children }) {
  const [categoryDataWithProducts, setCategoryDataWithProducts] = useState([]);

  return (
    <CategoryContext.Provider value={{ categoryDataWithProducts, setCategoryDataWithProducts }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  return useContext(CategoryContext);
}
