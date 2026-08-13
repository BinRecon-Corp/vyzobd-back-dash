# Inventory Pipeline & Mapping Audit (`README_INVENTORY_MAPPING_AUDIT.md`)

This report provides a step-by-step physical trace of inventory calculations and stock mappings from our relational database tables to the storefront REST API response payloads.

---

## 1. Step-By-Step Inventory Pipeline Trace

```
  [Database: pgSQL]
  - Inventory Table
    * quantityAvailable: 25
    * quantityReserved: 5
         │
         ▼
  [Service: Prisma Engine]
  - Eager-loaded in Product Service:
    `include: { inventory: true, variants: { include: { inventories: true } } }`
         │
         ▼
  [DTO Mapper: mappers.ts]
  - Calculates actual stock per variant and product:
    `availableStock = Math.max(0, quantityAvailable - quantityReserved)`
         │
         ▼
  [API Controller & Response Formatter]
  - Outputs standardized JSON structure:
    `{ status: "success", data: { id: "...", stock: 20, inStock: true } }`
         │
         ▼
  [Next.js Storefront Client]
  - Enables Add To Cart/Buy Now and renders "20 Units Left" badge
```

---

## 2. Core Service Calculations

Our backend implements strict inventory calculations inside two domains: **Read paths (Browsing)** and **Write paths (Checkout)**.

### A. Read Path Stock Calculations (Catalog Services)
To prevent performance degradation during listing views, stock is dynamically calculated inside our DTO mappers rather than triggering separate query chains.
* **Variant-Level Stock**:
  ```typescript
  const calculatedStock = v.inventories && v.inventories.length > 0
    ? v.inventories.reduce((sum: number, inv: any) => sum + Math.max(0, (inv.quantityAvailable ?? inv.quantity ?? 0) - (inv.quantityReserved ?? 0)), 0)
    : (v.stock ?? 0);
  ```
* **Product-Level Stock** (Handles single-variant items or summaries):
  ```typescript
  const rootStock = product.inventory
    ? Math.max(0, (product.inventory.quantityAvailable ?? product.inventory.quantity ?? 0) - (product.inventory.quantityReserved ?? 0))
    : (variants.length > 0 ? variants.reduce((sum, v) => sum + v.stock, 0) : 0);
  ```

### B. Write Path Inventory Validations (Cart & Checkout Services)
Cart addition and checkout completion perform **strict, real-time validations** using transaction locks to prevent concurrency-based overselling:
1. **Quantity Lock-Guard**: Checks available stock using real-time values:
   ```typescript
   availableStock = inv.quantityAvailable - inv.quantityReserved
   ```
2. **Transaction Decrementing**: Decrements database stock safely inside atomic blocks during order completion:
   ```typescript
   await tx.inventory.updateMany({
     where: { 
       id: targetInventory.id,
       quantityAvailable: { gte: item.quantity + targetInventory.quantityReserved }
     },
     data: {
       quantityAvailable: { decrement: item.quantity },
     },
   });
   ```

---

## 3. Structural Configurations Tested

To guarantee robustness, the mapping layers have been optimized and validated for both standard inventory strategies:

### Scenario A: Single-Variant Setup (Product Inventory)
For products that do not utilize complex sizing or color variants:
* The system utilizes the `Product.inventory` relation.
* Top-level DTO mappings resolve to:
  * `product.stock = product.inventory.quantityAvailable - product.inventory.quantityReserved`
  * `product.inStock = product.stock > 0`

### Scenario B: Multi-Variant Setup (ProductVariant Inventory)
For products with multiple sizing, color, or material configurations:
* Each variant contains individual `inventories` records mapped across warehouses.
* Storefront details utilize the specific selected variant stock:
  * `variant.stock = sum(warehouse_inventories.quantityAvailable - warehouse_inventories.quantityReserved)`
  * `variant.inStock = variant.stock > 0`
* The top-level product stock acts as an aggregate summary representing the sum of all its variants.
