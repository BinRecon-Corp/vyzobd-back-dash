import { api } from "../lib/api";

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  shortDescription: string | null;
  price: number | null;
  categoryId: string;
  brandId: string | null;
  
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  
  trackInventory: boolean;
  status: string;
  isActive: boolean;
  
  barcode: string | null;
  gtin: string | null;
  mpn: string | null;
  condition: string | null;
  
  category?: { id: string; name: string };
  brand?: { id: string; name: string };
  inventory?: { quantity: number; lowStockThreshold: number; quantityAvailable: number };
  images?: { id: string; url: string; isPrimary: boolean }[];
  tags?: any[];
  variants?: any[];
}

export const getProducts = async (): Promise<Product[]> => {
  const { data } = await api.get("/products");
  return data.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const { data } = await api.get(`/products/${id}`);
  return data.data;
};

export const createProduct = async (productData: any): Promise<Product> => {
  const { data } = await api.post("/products", productData);
  return data.data;
};

export const updateProduct = async (id: string, productData: any): Promise<Product> => {
  const { data } = await api.put(`/products/${id}`, productData);
  return data.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`/products/${id}`);
};
