import React, { createContext, useState, useContext } from "react";

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [activeRequests, setActiveRequests] = useState(0);

  const showLoading = () => setActiveRequests((prev) => prev + 1);
  const hideLoading = () => setActiveRequests((prev) => Math.max(prev - 1, 0));

  const isLoading = activeRequests > 0; // Exibe loading se houver requisições ativas

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
