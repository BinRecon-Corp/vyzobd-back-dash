# Public Storefront API Reference

Base Path: `/api/storefront/v1`

All public APIs can be accessed without authentication headers or tokens.

---

## 1. Catalog APIs

### GET `/products`
Fetch list of published products with filtering, sorting, and pagination.

- **Auth**: None
- **Query Parameters**:
  - `page` (number, optional, default: 1)
  - `limit` (number, optional, default: 12)
  - `categoryId` (UUID, optional)
  - `brandId` (UUID, optional)
  - `search` (string, optional)
  - `sort` (string, optional: `price_asc`, `price_desc`, `newest`)
- **Response Example (200 OK)**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "c7a8b291-3e41-4c12-98ab-8f0a12345678",
        "name": "Wireless Noise-Canceling Headphones",
        "slug": "wireless-noise-canceling-headphones",
        "price": 199.99,
        "compareAtPrice": 249.99,
        "primaryImage": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
        "category": { "name": "Electronics", "slug": "electronics" },
        "brand": { "name": "AudioTech", "slug": "audiotech" }
      }
    ],
    "total": 45,
    "page": 1,
    "limit": 12
  }
}
```

### GET `/products/:slug`
Get detailed product data by slug.

- **Auth**: None
- **Response Example (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "c7a8b291-3e41-4c12-98ab-8f0a12345678",
    "name": "Wireless Noise-Canceling Headphones",
    "slug": "wireless-noise-canceling-headphones",
    "description": "Premium active noise cancelling headphones with 30hr battery life.",
    "price": 199.99,
    "variants": [
      { "id": "v1", "sku": "ANC-BLK", "name": "Black", "price": 199.99, "stock": 25 }
    ]
  }
}
```

---

## 2. Search & Facets APIs

### GET `/search`
Search products across name, description, tags, and category names.

- **Auth**: None
- **Query Parameters**: `q` (string, required), `category`, `brand`, `minPrice`, `maxPrice`

### GET `/search/facets`
Fetch dynamic filter categories, brands, and price bounds for search pages.

---

## 3. Merchant Feed & CMS Public APIs

### GET `/merchant/feed.xml`
Google Shopping XML Product Feed.

### GET `/settings/public`
Fetch public platform branding settings, logo, currency symbol, and feature flags.

### GET `/pages/:slug` & GET `/blog` & GET `/faqs`
Fetch published CMS pages, blog articles, and FAQ categories.
