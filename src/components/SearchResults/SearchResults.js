import React from "react";
import "./SearchResults.css";

const SearchResults = ({ 
  products, 
  children 
}) => {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="search-results-section">
      <h3 className="search-results-title">Resultados da Busca</h3>
      <div className="search-results-grid">
        {products.map((product) => (
          <React.Fragment key={product.id}>
            {children?.(product)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
