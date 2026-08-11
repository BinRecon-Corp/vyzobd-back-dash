# PUBLIC STOREFRONT API SPECIFICATION

**Base URL:** `/api/storefront/v1`  
**Authentication:** None (100% Public Access)  
**Content-Type:** `application/json`  

---

## 1. PRODUCTS API (`/api/storefront/v1/products`)

### 1.1 List Catalog Products
Retrieves active catalog products with filtering, search, pagination, and sorting capabilities.

- **Method:** `GET`
- **URL:** `/api/storefront/v1/products`
- **Authentication:** None (Public)

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | `integer` | No | `1` | Page number (min: 1) |
| `limit` | `integer` | No | `20` | Items per page (min: 1, max: 100) |
| `q` / `search` | `string` | No | - | Keyword search across product name, description, SKU |
| `category` | `string` | No | - | Filter by category slug or ID |
| `brand` | `string` | No | - | Filter by brand slug or ID |
| `minPrice` / `min_price` | `number` | No | - | Minimum price threshold (must be <= maxPrice) |
| `maxPrice` / `max_price` | `number` | No | - | Maximum price threshold |
| `sort` | `string` | No | `newest` | Sorting order (`newest`, `oldest`, `price_asc`, `price_desc`, `name_asc`, `name_desc`) |

#### Request Example
`GET /api/storefront/v1/products?category=audio&minPrice=50&maxPrice=300&sort=price_asc&page=1&limit=10`

#### Response DTO & Structure (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "p9998887-7766-5544-3322-110099887766",
      "name": "Wireless Noise Cancelling Headphones",
      "slug": "wireless-noise-cancelling-headphones",
      "description": "High-fidelity active noise cancelling headphones with 30-hour battery life.",
      "shortDescription": "30h battery life, ANC, Bluetooth 5.2",
      "price": 199.99,
      "seoTitle": "Wireless Noise Cancelling Headphones - Premium Audio",
      "seoDescription": "Buy high-fidelity active noise cancelling headphones online.",
      "ogImage": "https://res.cloudinary.com/demo/image/upload/v1/headphones.jpg",
      "gtin": "1234567890123",
      "mpn": "ANC-2026",
      "condition": "NEW",
      "category": {
        "id": "cat-audio-123",
        "name": "Audio Equipment",
        "slug": "audio",
        "description": "Headphones, speakers, and amplifiers",
        "image": "https://res.cloudinary.com/demo/image/upload/v1/category-audio.jpg",
        "icon": "headphones",
        "parentId": null,
        "seoTitle": "Audio Equipment Category",
        "seoDescription": "Browse top audio gear.",
        "ogImage": null
      },
      "brand": {
        "id": "b-brand-456",
        "name": "SoundMax",
        "slug": "soundmax",
        "logoUrl": "https://res.cloudinary.com/demo/image/upload/v1/soundmax-logo.png",
        "description": "Leading audio technology brand",
        "seoTitle": "SoundMax Audio Products",
        "seoDescription": "Official SoundMax store.",
        "ogImage": null
      },
      "primaryImage": "https://res.cloudinary.com/demo/image/upload/v1/headphones.jpg",
      "gallery": [
        {
          "id": "img-001",
          "url": "https://res.cloudinary.com/demo/image/upload/v1/headphones.jpg",
          "altText": "Front View",
          "isPrimary": true,
          "sortOrder": 0
        }
      ],
      "variants": [
        {
          "id": "v-111",
          "sku": "SND-BLK-01",
          "barcode": "880123456789",
          "price": 199.99,
          "compareAtPrice": 249.99,
          "stock": 45,
          "inStock": true,
          "options": {
            "Color": "Matte Black"
          },
          "image": "https://res.cloudinary.com/demo/image/upload/v1/headphones-black.jpg"
        }
      ],
      "tags": ["audio", "wireless", "anc", "bluetooth"]
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "ga4": {
    "event": "view_item_list",
    "ecommerce": {
      "item_list_name": "Product List",
      "items": [
        {
          "item_id": "p9998887-7766-5544-3322-110099887766",
          "item_name": "Wireless Noise Cancelling Headphones",
          "price": 199.99,
          "item_category": "Audio Equipment",
          "item_brand": "SoundMax"
        }
      ]
    }
  }
}
```

---

### 1.2 Get Single Product Details
Retrieves detailed product metadata, variant inventory, image gallery, and computed SEO tags by product slug.

- **Method:** `GET`
- **URL:** `/api/storefront/v1/products/:slug`
- **Authentication:** None (Public)

#### Path Parameters
- `slug` (`string`, required): Unique product URL slug (e.g. `wireless-noise-cancelling-headphones`).

#### Response Structure (`200 OK`)
```json
{
  "data": {
    "id": "p9998887-7766-5544-3322-110099887766",
    "name": "Wireless Noise Cancelling Headphones",
    "slug": "wireless-noise-cancelling-headphones",
    "description": "Full technical description with Markdown formatting.",
    "shortDescription": "30h battery life, ANC, Bluetooth 5.2",
    "price": 199.99,
    "seoTitle": "Wireless Noise Cancelling Headphones - Premium Audio",
    "seoDescription": "Buy high-fidelity active noise cancelling headphones online.",
    "ogImage": "https://res.cloudinary.com/demo/image/upload/v1/headphones.jpg",
    "gtin": "1234567890123",
    "mpn": "ANC-2026",
    "condition": "NEW",
    "category": {
      "id": "cat-audio-123",
      "name": "Audio Equipment",
      "slug": "audio"
    },
    "brand": {
      "id": "b-brand-456",
      "name": "SoundMax",
      "slug": "soundmax"
    },
    "gallery": [
      {
        "id": "img-001",
        "url": "https://res.cloudinary.com/demo/image/upload/v1/headphones.jpg",
        "altText": "Primary Angle",
        "isPrimary": true,
        "sortOrder": 0
      }
    ],
    "variants": [
      {
        "id": "v-111",
        "sku": "SND-BLK-01",
        "price": 199.99,
        "compareAtPrice": 249.99,
        "stock": 45,
        "inStock": true,
        "options": { "Color": "Matte Black" },
        "image": "https://res.cloudinary.com/demo/image/upload/v1/headphones-black.jpg"
      }
    ]
  },
  "ga4": {
    "event": "view_item",
    "ecommerce": {
      "items": [
        {
          "item_id": "p9998887-7766-5544-3322-110099887766",
          "item_name": "Wireless Noise Cancelling Headphones",
          "price": 199.99
        }
      ]
    }
  }
}
```

---

## 2. CATEGORIES API (`/api/storefront/v1/categories`)

### 2.1 List Categories
Retrieves category taxonomy list or hierarchical category tree.

- **Method:** `GET`
- **URL:** `/api/storefront/v1/categories`
- **Authentication:** None (Public)

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tree` | `string` | No | `true` | If `true`, returns nested parent-child tree structure. If `false`, returns flat array. |

#### Response DTO & Structure (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "cat-electronics-001",
      "name": "Electronics",
      "slug": "electronics",
      "description": "Consumer electronics and gadgets",
      "image": "https://res.cloudinary.com/demo/image/upload/v1/electronics.jpg",
      "icon": "cpu",
      "parentId": null,
      "seoTitle": "Electronics - Shop Online",
      "seoDescription": "Discover latest electronics.",
      "ogImage": null,
      "children": [
        {
          "id": "cat-audio-123",
          "name": "Audio Equipment",
          "slug": "audio",
          "description": "Headphones & speakers",
          "parentId": "cat-electronics-001"
        }
      ]
    }
  ],
  "meta": {}
}
```

---

### 2.2 Get Category Details by Slug
Fetches a single category record by its slug.

- **Method:** `GET`
- **URL:** `/api/storefront/v1/categories/:slug`
- **Authentication:** None (Public)

#### Response Structure (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "cat-audio-123",
    "name": "Audio Equipment",
    "slug": "audio",
    "description": "Headphones, wireless earbuds, and home audio systems",
    "image": "https://res.cloudinary.com/demo/image/upload/v1/category-audio.jpg",
    "icon": "headphones",
    "parentId": "cat-electronics-001",
    "seoTitle": "Audio Equipment Category",
    "seoDescription": "Browse top audio gear.",
    "ogImage": null
  },
  "meta": {}
}
```

---

## 3. BRANDS API (`/api/storefront/v1/brands`)

### 3.1 List Brands
Retrieves paginated list of product brands.

- **Method:** `GET`
- **URL:** `/api/storefront/v1/brands`
- **Authentication:** None (Public)

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | `integer` | No | `1` | Page number |
| `limit` | `integer` | No | `50` | Items per page (max: 100) |

#### Response DTO & Structure (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "b-brand-456",
      "name": "SoundMax",
      "slug": "soundmax",
      "logoUrl": "https://res.cloudinary.com/demo/image/upload/v1/soundmax-logo.png",
      "description": "Leading audio technology manufacturer",
      "seoTitle": "SoundMax Audio Products",
      "seoDescription": "Official SoundMax store.",
      "ogImage": null
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "limit": 50,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

---

### 3.2 Get Brand Details by Slug
Fetches brand metadata by slug.

- **Method:** `GET`
- **URL:** `/api/storefront/v1/brands/:slug`
- **Authentication:** None (Public)

#### Response Structure (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "b-brand-456",
    "name": "SoundMax",
    "slug": "soundmax",
    "logoUrl": "https://res.cloudinary.com/demo/image/upload/v1/soundmax-logo.png",
    "description": "Leading audio technology manufacturer",
    "seoTitle": "SoundMax Audio Products",
    "seoDescription": "Official SoundMax store."
  },
  "meta": {}
}
```

---

## 4. SEARCH & FACETS API (`/api/storefront/v1/search`)

### 4.1 Search Products
Performs full-text keyword search and complex multi-facet filtering.

- **Method:** `GET`
- **URL:** `/api/storefront/v1/search`
- **Authentication:** None (Public)

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | `string` | No | - | Full-text query string |
| `category` | `string` | No | - | Category slug or ID filter |
| `brand` | `string` | No | - | Brand slug or ID filter |
| `minPrice` | `number` | No | - | Minimum price filter |
| `maxPrice` | `number` | No | - | Maximum price filter |
| `inStock` | `string` | No | - | Filter in-stock items (`"true"`, `"false"`, `"1"`, `"0"`) |
| `page` | `integer` | No | `1` | Page number |
| `limit` | `integer` | No | `20` | Results per page (max: 100) |
| `sort` | `string` | No | `relevance` | Sort order (`relevance`, `newest`, `oldest`, `price_asc`, `price_desc`, `name_asc`, `name_desc`) |

#### Response DTO & Structure (`200 OK`)
```json
{
  "data": [
    {
      "id": "p9998887-7766-5544-3322-110099887766",
      "name": "Wireless Noise Cancelling Headphones",
      "slug": "wireless-noise-cancelling-headphones",
      "price": 199.99,
      "thumbnail": "https://res.cloudinary.com/demo/image/upload/v1/headphones.jpg"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

---

### 4.2 Aggregated Search Facets
Returns aggregated count distributions across categories, brands, price ranges, and stock availability for active search criteria.

- **Method:** `GET`
- **URL:** `/api/storefront/v1/search/facets`
- **Authentication:** None (Public)

#### Query Parameters
Accepts `q`, `category`, `brand`, `minPrice`, `maxPrice`, `inStock`.

#### Response Structure (`200 OK`)
```json
{
  "success": true,
  "data": {
    "categories": [
      { "id": "cat-audio-123", "name": "Audio Equipment", "slug": "audio", "count": 15 }
    ],
    "brands": [
      { "id": "b-brand-456", "name": "SoundMax", "slug": "soundmax", "count": 8 }
    ],
    "priceRange": {
      "min": 19.99,
      "max": 499.99
    },
    "availability": {
      "inStockCount": 22,
      "outOfStockCount": 3
    }
  }
}
```

---

## 5. BLOG API (`/api/storefront/v1/blog`)

### 5.1 List Published Blog Posts
Retrieves all published blog articles.

- **Method:** `GET`
- **URL:** `/api/storefront/v1/blog`
- **Authentication:** None (Public)

#### Response Structure (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "post-101",
      "title": "Top 10 Noise Cancelling Headphones of 2026",
      "slug": "top-10-noise-cancelling-headphones-2026",
      "excerpt": "Discover the best audio gear tested by experts.",
      "content": "Full markdown blog content...",
      "publishedAt": "2026-08-01T10:00:00.000Z",
      "category": {
        "id": "blog-cat-01",
        "name": "Audio Guides"
      },
      "tags": [
        { "name": "Headphones" },
        { "name": "Buying Guide" }
      ],
      "featuredImage": {
        "url": "https://res.cloudinary.com/demo/image/upload/v1/blog-banner.jpg"
      },
      "seoMetadata": {
        "metaTitle": "Top 10 Headphones of 2026",
        "metaDescription": "Expert audio guide for noise cancelling headphones."
      }
    }
  ],
  "meta": {}
}
```

---

### 5.2 Get Blog Article by Slug
Fetches a single published blog article by slug.

- **Method:** `GET`
- **URL:** `/api/storefront/v1/blog/:slug`
- **Authentication:** None (Public)

#### Response Structure (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "post-101",
    "title": "Top 10 Noise Cancelling Headphones of 2026",
    "slug": "top-10-noise-cancelling-headphones-2026",
    "content": "# Top 10 Noise Cancelling Headphones...",
    "publishedAt": "2026-08-01T10:00:00.000Z",
    "seoMetadata": {
      "metaTitle": "Top 10 Headphones of 2026"
    }
  },
  "meta": {}
}
```

---

## 6. CMS & CONTENT PAGES (`/api/storefront/v1/pages`, `/api/storefront/v1/landing-pages`, `/api/storefront/v1/faqs`)

### 6.1 List Custom CMS Pages
Retrieves list of published static pages (e.g. About Us, Terms & Conditions, Privacy Policy).

- **Method:** `GET`
- **URL:** `/api/storefront/v1/pages`
- **Authentication:** None (Public)

#### Response Structure (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "page-about",
      "title": "About Our Store",
      "slug": "about-us",
      "content": "<p>Welcome to our storefront...</p>",
      "seoMetadata": {
        "metaTitle": "About Us - Store Information"
      }
    }
  ],
  "meta": {}
}
```

---

### 6.2 Get CMS Page by Slug
- **Method:** `GET`
- **URL:** `/api/storefront/v1/pages/:slug`
- **Authentication:** None (Public)

---

### 6.3 Get Marketing Landing Page by Slug
Retrieves layout builder structure and promotional blocks for marketing landing pages.

- **Method:** `GET`
- **URL:** `/api/storefront/v1/landing-pages/:slug`
- **Authentication:** None (Public)

#### Response Structure (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "landing-summer-sale",
    "title": "Summer Campaign 2026",
    "slug": "summer-sale",
    "layoutData": {
      "heroBanner": "https://res.cloudinary.com/demo/image/upload/v1/summer.jpg",
      "featuredCategorySlug": "audio"
    },
    "seoMetadata": {
      "metaTitle": "Summer Sale Deals"
    }
  },
  "meta": {}
}
```

---

### 6.4 List Support FAQs
Retrieves active support frequently asked questions grouped by categories.

- **Method:** `GET`
- **URL:** `/api/storefront/v1/faqs`
- **Authentication:** None (Public)

#### Response Structure (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "faq-001",
      "question": "What is the standard delivery timeframe?",
      "answer": "Standard delivery takes 2-3 business days within Dhaka and 3-5 business days across Bangladesh.",
      "orderIndex": 1,
      "category": {
        "id": "faq-cat-shipping",
        "name": "Shipping & Delivery"
      }
    }
  ],
  "meta": {}
}
```

---

## 7. PUBLIC SETTINGS API (`/api/storefront/v1/settings/public`)

### 7.1 Get Merchant Public Configuration
Retrieves storefront branding elements, global SEO metadata, currency defaults, and enabled analytics tracker IDs.

- **Method:** `GET`
- **URL:** `/api/storefront/v1/settings/public`
- **Authentication:** None (Public)

#### Response Structure (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "branding": {
      "siteName": "NexCommerce Store",
      "siteTitle": "NexCommerce - Next-Gen E-Commerce",
      "siteTagline": "Premium Quality Electronics & Gear",
      "logoUrl": "https://res.cloudinary.com/demo/image/upload/v1/store-logo.png",
      "faviconUrl": "https://res.cloudinary.com/demo/image/upload/v1/favicon.ico",
      "adminPanelName": "NexCommerce Admin",
      "adminPanelLogo": "https://res.cloudinary.com/demo/image/upload/v1/admin-logo.png",
      "primaryColor": "#2563eb",
      "footerText": "© 2026 NexCommerce Inc. All rights reserved.",
      "defaultLanguage": "en",
      "defaultCurrency": "BDT",
      "defaultTimezone": "Asia/Dhaka"
    },
    "seo": {
      "metaTitle": "NexCommerce - Next-Gen E-Commerce Platform",
      "metaDescription": "Shop top electronic products with quick shipping and cash on delivery.",
      "metaKeywords": "ecommerce, electronics, audio, bangladesh, shopping",
      "ogTitle": "NexCommerce Storefront",
      "ogDescription": "Shop top electronic products online.",
      "ogImage": "https://res.cloudinary.com/demo/image/upload/v1/og-share.png",
      "twitterTitle": "NexCommerce Storefront",
      "twitterDescription": "Shop top electronic products online.",
      "twitterImage": "https://res.cloudinary.com/demo/image/upload/v1/og-share.png",
      "customHeadCode": null
    },
    "analytics": {
      "googleAnalyticsId": "G-ABC123456",
      "googleTagManagerId": "GTM-XYZ789",
      "facebookPixelId": "1234567890",
      "hotjarId": null,
      "enableAnalytics": true
    }
  }
}
```

---

*End of Public Storefront API Specification.*
