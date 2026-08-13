# Product Stock & Availability Audit Report (`README_PRODUCT_STOCK_AUDIT.md`)

## 1. Problem Statement & Symptoms
In the Next.js Storefront, products are successfully displayed on listing and details pages, but:
* **Add To Cart** is permanently disabled.
* **Buy Now** is permanently disabled.
* All products and variants display as **"Out of Stock"** with zero available units.

---

## 2. Root Cause Analysis (Database to DTO Disconnection)

Through a physical trace of the data pipeline, we discovered two fatal mismatches in the codebase that caused the API to permanently output `stock: 0` and `inStock: false`:

### Root Cause A: Non-Existent Column Mapped
The storefront DTO mapper (`src/backend/dtos/storefront/mappers.ts`) attempted to retrieve stock directly from the `ProductVariant` database object:
```typescript
stock: v.stock || 0
```
However, the `ProductVariant` model in the Prisma schema (`prisma/schema.prisma`) **does not contain a `stock` column**. Variant inventories are stored in a separate relational `Inventory` table to support multi-warehouse routing. Because `v.stock` returned `undefined`, the mapper default fallback kicked in, assigning `stock: 0` for all variants in every product response.

### Root Cause B: Missing Eager Loading of Inventories
To determine `inStock` status, the DTO mapper fell back to a secondary check:
```typescript
inStock: v.stock > 0 || v.inventories?.some((i: any) => i.quantity > 0) || false
```
But `storefrontProductService` (`src/backend/services/storefront/product.service.ts`) **did not include `inventories`** in the `variants` include block for either `getProducts()` or `getProductBySlug()`. 

Because `v.inventories` was never fetched from the database, it evaluated to `undefined`, making `inStock` resolve to `false` for every product.

### Root Cause C: Legacy Inventory Property Usage
The DTO mapper checked the legacy field `i.quantity`. In the production database, however, inventory tracking is performed using the `quantityAvailable` and `quantityReserved` fields, making simple checks on `i.quantity` obsolete.

---

## 3. Physical Patches Implemented

To resolve these mismatches, we have applied the following physical code changes to the backend:

### 1. Unified Mappings in `src/backend/dtos/storefront/mappers.ts`
We refactored `mapProductToStorefrontDTO` to dynamically calculate stock levels based on active warehouse records, and fallback securely to `0`:
```typescript
const calculatedStock = v.inventories && v.inventories.length > 0
  ? v.inventories.reduce((sum: number, inv: any) => sum + Math.max(0, (inv.quantityAvailable ?? inv.quantity ?? 0) - (inv.quantityReserved ?? 0)), 0)
  : (v.stock ?? 0);
```

### 2. Enabled Eager-Loading in `src/backend/services/storefront/product.service.ts`
Updated both listing and detailed view queries to load both variant inventories and product-level inventories:
```typescript
// Added inventory and inventories to findMany & findFirst queries
inventory: true,
variants: {
  where: { deletedAt: null, isActive: true },
  include: {
    images: true,
    inventories: true, // Now eagerly fetched
    attributes: { ... }
  }
}
```

### 3. Exposed Stock Fields on `StorefrontProduct` in `src/backend/dtos/storefront/types.ts`
Extended the primary storefront interface so that single-variant configurations also receive top-level stock visibility:
```typescript
export interface StorefrontProduct {
  ...
  stock?: number;
  inStock?: boolean;
}
```

---

## 4. Affected Database vs DTO Mappings

| Database Model & Columns | Storefront DTO Property | Mapping Logic / Calculation |
| :--- | :--- | :--- |
| `ProductVariant` (No stock col) | `StorefrontVariant.stock` | Sum of `Math.max(0, quantityAvailable - quantityReserved)` across `inventories` |
| `ProductVariant` | `StorefrontVariant.inStock` | `stock > 0` |
| `Inventory.quantityAvailable` / `quantityReserved` | `StorefrontProduct.stock` | Sum of all variants' stock, or direct `product.inventory` available stock |
| `Inventory` | `StorefrontProduct.inStock` | `stock > 0` |
