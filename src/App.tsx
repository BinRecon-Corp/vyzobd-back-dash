import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminLayout } from './components/layout/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { ProductCreate } from './pages/products/ProductCreate';
import { ProductEdit } from './pages/products/ProductEdit';
import { ProductView } from './pages/products/ProductView';
import { CategoryList } from './pages/categories/CategoryList';
import { CategoryCreate } from './pages/categories/CategoryCreate';
import { CategoryEdit } from './pages/categories/CategoryEdit';
import { BrandList } from './pages/brands/BrandList';
import { BrandCreate } from './pages/brands/BrandCreate';
import { BrandEdit } from './pages/brands/BrandEdit';
import { Analytics } from './pages/Analytics';
import { Inventory } from './pages/Inventory';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { GA4Example } from './pages/GA4Example';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductCreate />} />
            <Route path="products/:id" element={<ProductView />} />
            <Route path="products/:id/edit" element={<ProductEdit />} />
            <Route path="categories" element={<CategoryList />} />
            <Route path="categories/new" element={<CategoryCreate />} />
            <Route path="categories/:id/edit" element={<CategoryEdit />} />
            <Route path="brands" element={<BrandList />} />
            <Route path="brands/new" element={<BrandCreate />} />
            <Route path="brands/:id/edit" element={<BrandEdit />} />
            <Route path="orders" element={<PlaceholderPage title="Orders" />} />
            <Route path="customers" element={<PlaceholderPage title="Customers" />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="analytics/ga4-example" element={<GA4Example />} />
            <Route path="settings" element={<PlaceholderPage title="Settings" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
