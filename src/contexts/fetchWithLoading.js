import { useLoading } from "./LoadingContext";

export const useFetchWithLoading = () => {
  const { showLoading, hideLoading } = useLoading();

  const fetchWithLoading = async (url, options = {}) => {
    showLoading(); // Incrementa o contador de requisições
    try {
      const response = await fetch(url, options); // Faz a requisição
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.statusText}`);
      }
      return await response; // Retorna os dados JSON
    } catch (error) {
      console.error("Erro na requisição:", error);
      throw error; // Propaga o erro
    } finally {
      hideLoading(); // Decrementa o contador de requisições
    }
  };

  return { fetchWithLoading };
};
