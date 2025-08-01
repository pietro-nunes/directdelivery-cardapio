// LoadingContext.js
import React, {
  createContext, useState, useContext, useCallback, useMemo
} from "react";

const LoadingContext = createContext(null);

export const LoadingProvider = ({ children }) => {
  const [activeRequests, setActiveRequests] = useState(0);

  const showLoading = useCallback(() => {
    setActiveRequests((prev) => prev + 1);
  }, []);

  const hideLoading = useCallback(() => {
    setActiveRequests((prev) => Math.max(prev - 1, 0));
  }, []);

  // >>> AQUI: fetchWithLoading estável e com finally
  const fetchWithLoading = useCallback(async (input, init) => {
    showLoading();
    try {
      const res = await fetch(input, init);
      return res;
    } finally {
      // mesmo em erro ou abort, sempre decrementa
      hideLoading();
    }
  }, [showLoading, hideLoading]);

  const isLoading = activeRequests > 0;

  const value = useMemo(() => ({
    isLoading,
    showLoading,
    hideLoading,
    fetchWithLoading,
  }), [isLoading, showLoading, hideLoading, fetchWithLoading]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useLoading deve ser usado dentro de LoadingProvider");
  const { isLoading, showLoading, hideLoading } = ctx;
  return { isLoading, showLoading, hideLoading };
};

export const useFetchWithLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error("useFetchWithLoading deve ser usado dentro de LoadingProvider");
  return { fetchWithLoading: ctx.fetchWithLoading };
};
