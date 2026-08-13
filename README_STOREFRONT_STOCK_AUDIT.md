# Headless Storefront Integration Guide (`README_STOREFRONT_STOCK_AUDIT.md`)

This guide outlines exactly how frontend developers building the Next.js Storefront can safely integrate and consume our standardized stock fields to drive high-performance user interactions.

---

## 1. Storefront Component Control Matrix

To prevent page flickers or broken purchasing states, storefront components should parse the API payloads using this strict field mapping matrix:

| Interactive UI Control | Target DTO Field | Frontend Evaluation Pattern | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **Add To Cart Button** | `StorefrontVariant.stock` & `inStock` | `variant.inStock && variant.stock > 0` | Enable button if true; disable with `"Out of Stock"` label if false. |
| **Buy Now Button** | `StorefrontVariant.stock` & `inStock` | `variant.inStock && variant.stock > 0` | Enable button if true; disable/hide if false. |
| **Availability Badge** | `StorefrontVariant.inStock` | `variant.inStock ? "In Stock" : "Out of Stock"` | Green badge for active stock, Red badge for out-of-stock. |
| **Low Stock Threshold Alert** | `StorefrontVariant.stock` | `variant.stock <= 10 && variant.stock > 0` | Display warning: `"Only X items left in stock!"` if true. |

---

## 2. Headless Consumer Integration Patterns

Here are reference integration blocks in React / Next.js demonstrating how to safely read and bind our newly standardized API responses to the storefront components.

### A. Dynamic Hook for Product Details
```typescript
import { useState, useMemo } from 'react';

interface Variant {
  id: string;
  sku: string;
  price: number;
  stock: number;
  inStock: boolean;
  options: Record<string, string>;
}

interface Product {
  id: string;
  name: string;
  variants: Variant[];
  stock: number;
  inStock: boolean;
}

export function useProductStock(product: Product) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // 1. Find currently active variant based on user selections
  const activeVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return null;
    return product.variants.find((v) => 
      Object.entries(selectedOptions).every(([key, value]) => v.options[key] === value)
    ) || product.variants[0];
  }, [product.variants, selectedOptions]);

  // 2. Resolve final stock metrics (falls back to root-level stock if no variants exist)
  const stockMetrics = useMemo(() => {
    if (activeVariant) {
      return {
        stock: activeVariant.stock,
        inStock: activeVariant.inStock,
        sku: activeVariant.sku,
        variantId: activeVariant.id,
      };
    }
    return {
      stock: product.stock ?? 0,
      inStock: product.inStock ?? false,
      sku: null,
      variantId: null,
    };
  }, [activeVariant, product]);

  return {
    ...stockMetrics,
    setSelectedOptions,
    selectedOptions,
  };
}
```

### B. Purchase Form Component Integration
```tsx
import React from 'react';
import { useProductStock } from '../hooks/useProductStock';

export function ProductPurchaseForm({ product }: { product: any }) {
  const { stock, inStock, variantId } = useProductStock(product);

  return (
    <div className="p-6 bg-white border border-gray-100 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Purchase Options</h3>
        
        {/* Real-time Availability Badge */}
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
          inStock 
            ? "bg-green-50 text-green-700 border border-green-200" 
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {inStock ? "In Stock" : "Out of Stock"}
        </span>
      </div>

      {/* Low Stock Threshold Warning Alert */}
      {inStock && stock <= 10 && (
        <div className="p-3 mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md">
          ⚠️ Hurry! Only <strong>{stock}</strong> items left in stock.
        </div>
      )}

      {/* Add to Cart & Buy Now Buttons */}
      <div className="flex flex-col gap-3">
        <button
          id="add-to-cart-btn"
          disabled={!inStock || stock <= 0}
          className={`w-full py-3 text-center font-medium rounded-lg transition-colors ${
            inStock && stock > 0
              ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
          }`}
        >
          {inStock && stock > 0 ? "Add To Cart" : "Out Of Stock"}
        </button>

        <button
          id="buy-now-btn"
          disabled={!inStock || stock <= 0}
          className={`w-full py-3 text-center font-medium rounded-lg transition-colors ${
            inStock && stock > 0
              ? "bg-black hover:bg-neutral-900 text-white shadow-sm"
              : "bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100"
          }`}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
```
