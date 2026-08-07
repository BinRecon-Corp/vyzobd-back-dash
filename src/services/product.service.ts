import { api } from "../lib/api";

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  price: string;
  categoryId: string;
  brandId: string | null;
  isActive: boolean;
  category?: { id: string; name: string };
  brand?: { id: string; name: string };
  inventory?: { quantity: number; lowStock: number };
}

export const getProducts = async (): Promise<Product[]> => {
  const { data } = await api.get("/products");
  return data.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const { data } = await api.get(`/products/${id}`);
  return data.data;
};

export const createProduct = async (productData: Partial<Product>): Promise<Product> => {
  const { data } = await api.post("/products", productData);
  return data.data;
};

export const updateProduct = async (id: string, productData: Partial<Product>): Promise<Product> => {
  const { data } = await api.put(`/products/${id}`, productData);
  return data.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`/products/${id}`);
};
