/**
 * Remove acentos de uma string para facilitar a busca
 */
export const removeAccents = (str) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const searchProducts = (products, searchTerm) => {
  const term = removeAccents(searchTerm.trim().toLowerCase());
  if (!term) return [];

  return products.filter((product) => {
    const name = removeAccents((product.name || "").toLowerCase());
    const desc = removeAccents((product.description || "").toLowerCase());
    return name.startsWith(term) || desc.startsWith(term);
  });
};

export const getAllProducts = (categories) =>
  categories.flatMap((c) => (c.isActive ? c.products : []));