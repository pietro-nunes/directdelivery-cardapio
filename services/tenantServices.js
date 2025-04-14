import api from "./api"; // seu axios já configurado com baseURL

export async function fetchTenantBySlug(slug) {
  const response = await api.get(`/tenants/${slug}`); // ajuste a rota se necessário
  return response.data;
}
