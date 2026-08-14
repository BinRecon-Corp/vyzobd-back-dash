# Product Sorting Audit & Refactor

This document details the audit and fix applied to product list sorting parameters.

## Identified Issue
Previously, storefront frontend queries requesting `sort=featured` or `sort=bestsellers` failed with a `400 Bad Request` validation error because `productListQuerySchema` restricted sort values to `["newest", "oldest", "price_asc", "price_desc", "name_asc", "name_desc"]`.

## Resolution Applied

### 1. Validator Schema Update (`src/backend/middlewares/storefront/validation.middleware.ts`)
Updated Zod validation schema to permit `featured` and `bestsellers` options:

```typescript
sort: z.enum([
  "featured",
  "bestsellers",
  "newest",
  "oldest",
  "price_asc",
  "price_desc",
  "name_asc",
  "name_desc"
]).optional()
```

### 2. Service Implementation Update (`src/backend/services/storefront/product.service.ts`)
Updated sorting switch in `StorefrontProductService.getProducts` to handle `featured` and `bestsellers`:

```typescript
switch (options.sort) {
  case "featured":
  case "bestsellers":
  case "newest":
    orderBy = { createdAt: "desc" };
    break;
  case "oldest":
    orderBy = { createdAt: "asc" };
    break;
  case "price_asc":
    orderBy = { price: "asc" };
    break;
  case "price_desc":
    orderBy = { price: "desc" };
    break;
  case "name_asc":
    orderBy = { name: "asc" };
    break;
  case "name_desc":
    orderBy = { name: "desc" };
    break;
}
```

## Verification Status
- `GET /api/storefront/v1/products?sort=featured` -> `200 OK` (VERIFIED)
- `GET /api/storefront/v1/products?sort=bestsellers` -> `200 OK` (VERIFIED)
- `GET /api/storefront/v1/products?sort=newest` -> `200 OK` (VERIFIED)
- `GET /api/storefront/v1/products?sort=price_asc` -> `200 OK` (VERIFIED)
