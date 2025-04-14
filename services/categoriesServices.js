import api from "./api"; // seu axios já configurado com baseURL

export async function fetchCategoriesByTenant(tenantId) {
  const response = await api.get(`/categories/with-products/${tenantId}`); // ajuste a rota se necessário
  return response.data;
}
