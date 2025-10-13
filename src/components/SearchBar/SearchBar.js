import React from "react";
import { Search, X } from "lucide-react";
import "./SearchBar.css";

const SearchBar = ({
  searchTerm,
  onSearchChange,
  resultsCount,
}) => {
  return (
    <div className="search-bar-container">
      <div className="search-bar-wrapper">
        <Search className="search-icon" size={20} aria-hidden="true" />
        <input
          type="text"
          className="search-input"
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          inputMode="search"
          enterKeyHint="search"
          autoCapitalize="none"
          autoComplete="off"
          aria-label="Buscar produtos"
        />
        {searchTerm && (
          <button
            className="search-clear-btn"
            onClick={() => onSearchChange("")}
            aria-label="Limpar busca"
            type="button"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {searchTerm && resultsCount !== undefined && (
        <p className="search-results-text">
          {resultsCount === 0
            ? "Nenhum produto encontrado"
            : resultsCount === 1
            ? "1 produto encontrado"
            : `${resultsCount} produtos encontrados`}
        </p>
      )}
    </div>
  );
};

export default SearchBar;
