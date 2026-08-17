# CLOUDINARY & MEDIA SYSTEM ARCHITECTURE REFERENCE

**Module Version:** v1  
**Base Upload Route:** `/api/v1/media`  
**Supported Asset Types:** `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/svg+xml`  
**Max File Size:** `10 MB`  

---

## 1. MEDIA SYSTEM OVERVIEW

The application utilizes a hybrid media storage engine powered by **Cloudinary v2 SDK** with an automated **Local Data URI Fallback**. All uploaded files are indexed centrally in the PostgreSQL database under the `MediaAsset` entity while maintaining domain-specific media tables (`ProductImage`, `CategoryImage`, `BrandImage`).

### 1.1 Cloudinary Configuration & Fallback Engine
The Cloudinary service is initialized via environment variables in `src/backend/config/cloudinary.ts`:

- `CLOUDINARY_CLOUD_NAME` (or `VITE_CLOUDINARY_CLOUD_NAME`)
- `CLOUDINARY_API_KEY` (or `VITE_CLOUDINARY_API_KEY`)
- `CLOUDINARY_API_SECRET` (or `VITE_CLOUDINARY_API_SECRET`)

```typescript
export const isCloudinaryConfigured = (): boolean => {
  return Boolean(cloudName && apiKey && apiSecret && cloudName !== 'demo');
};
```

- **Cloudinary Active Mode:** Uploads stream directly to Cloudinary CDN with specific folder tagging and HTTPS URL generation (`secureUrl`, `public_id`).
- **Local Fallback Mode:** When credentials are absent or set to `'demo'`, files convert to Base64 Data URIs (`data:image/png;base64,...`) and generate synthetic public IDs (`local_timestamp_hash`).

---

## 2. CORE MEDIA FIELDS & SPECIFICATIONS

| Field | Type | Description |
|-------|------|-------------|
| `secureUrl` | `string` | Full HTTPS CDN URL to the asset served over Cloudinary SSL (or Base64 data string in fallback mode). |
| `publicId` / `cloudinaryPublicId` | `string` | Cloudinary's unique asset key used for image transformations, folder mapping, and CDN deletions. |
| `primaryImage` | `object \| string` | The main showcase asset marked with `isPrimary: true`. Fallbacks to the first image in `sortOrder`. |
| `thumbnail` | `string` | Convenient direct string URL pointing to the primary image for fast rendering in list views. |
| `gallery` | `array` | Collection of secondary/additional assets excluding the primary image, ordered by `sortOrder`. |

---

## 3. DOMAIN IMAGE IMPLEMENTATIONS

### 3.1 Product Images (`ProductImage`)
Used for catalog items, product variants, and gallery sliders.

- **Storage Folder:** `products` or `products/:productId`
- **Database Model:** `ProductImage` linked to `Product` and optionally `ProductVariant`
- **Supported Options:** `isPrimary` (`boolean`), `sortOrder` (`integer`), `altText` (`string`), `productVariantId` (`string`)

#### Product Image Response DTO
```json
{
  "id": "img-901-882",
  "url": "https://res.cloudinary.com/demo/image/upload/v1680000000/products/headphones-black.jpg",
  "imageUrl": "https://res.cloudinary.com/demo/image/upload/v1680000000/products/headphones-black.jpg",
  "secureUrl": "https://res.cloudinary.com/demo/image/upload/v1680000000/products/headphones-black.jpg",
  "publicId": "products/headphones-black",
  "cloudinaryPublicId": "products/headphones-black",
  "altText": "Wireless Headphones - Matte Black Side View",
  "isPrimary": true,
  "sortOrder": 0
}
```

#### Full Product Response with `thumbnail`, `primaryImage`, `gallery`
```json
{
  "id": "prod-12345",
  "name": "Wireless Noise Cancelling Headphones",
  "slug": "wireless-noise-cancelling-headphones",
  "thumbnail": "https://res.cloudinary.com/demo/image/upload/v1680000000/products/headphones-black.jpg",
  "primaryImage": {
    "id": "img-901-882",
    "url": "https://res.cloudinary.com/demo/image/upload/v1680000000/products/headphones-black.jpg",
    "imageUrl": "https://res.cloudinary.com/demo/image/upload/v1680000000/products/headphones-black.jpg",
    "publicId": "products/headphones-black",
    "altText": "Wireless Headphones - Front View",
    "isPrimary": true,
    "sortOrder": 0
  },
  "gallery": [
    {
      "id": "img-901-883",
      "url": "https://res.cloudinary.com/demo/image/upload/v1680000000/products/headphones-case.jpg",
      "imageUrl": "https://res.cloudinary.com/demo/image/upload/v1680000000/products/headphones-case.jpg",
      "publicId": "products/headphones-case",
      "altText": "Included Travel Case",
      "isPrimary": false,
      "sortOrder": 1
    }
  ],
  "variants": [
    {
      "id": "var-blk",
      "sku": "SND-BLK",
      "image": "https://res.cloudinary.com/demo/image/upload/v1680000000/products/headphones-black.jpg"
    }
  ]
}
```

---

### 3.2 Category Images (`CategoryImage`)
Associated with storefront navigation, category hero cards, and taxonomy banners.

- **Storage Folder:** `categories`
- **Database Models:** `CategoryImage` (detailed relation) and `Category.image` (legacy/fast string reference)

#### Category Image Response DTO
```json
{
  "id": "cat-img-001",
  "categoryId": "cat-audio-123",
  "secureUrl": "https://res.cloudinary.com/demo/image/upload/v1680000000/categories/audio-banner.jpg",
  "cloudinaryPublicId": "categories/audio-banner",
  "originalFilename": "audio-banner.jpg",
  "mimeType": "image/jpeg",
  "size": 245120,
  "width": 1200,
  "height": 400,
  "folder": "categories",
  "altText": "Audio Equipment Category Banner",
  "isPrimary": true,
  "sortOrder": 0
}
```

---

### 3.3 Brand Images (`BrandImage`)
Manages manufacturer logos, partner brand cards, and brand showcase pages.

- **Storage Folder:** `brands`
- **Database Models:** `BrandImage` (detailed relation) and `Brand.logoUrl` (direct logo URL)

#### Brand Image Response DTO
```json
{
  "id": "brand-img-001",
  "brandId": "brand-soundmax-456",
  "secureUrl": "https://res.cloudinary.com/demo/image/upload/v1680000000/brands/soundmax-logo.png",
  "cloudinaryPublicId": "brands/soundmax-logo",
  "originalFilename": "soundmax-logo.png",
  "mimeType": "image/png",
  "size": 48200,
  "width": 400,
  "height": 120,
  "folder": "brands",
  "altText": "SoundMax Official Logo",
  "isPrimary": true,
  "sortOrder": 0
}
```

---

### 3.4 Banner Images (`Banner`)
Manages homepage carousels, promotional headers, and mobile campaign graphics.

- **Storage Folder:** `banners`
- **Database Model:** `Banner`

#### Banner Response DTO
```json
{
  "id": "banner-summer-2026",
  "title": "Summer Audio Sale 2026",
  "desktopImage": "https://res.cloudinary.com/demo/image/upload/v1680000000/banners/summer-desktop.jpg",
  "mobileImage": "https://res.cloudinary.com/demo/image/upload/v1680000000/banners/summer-mobile.jpg",
  "linkUrl": "/categories/audio",
  "ctaText": "Shop Sale",
  "priority": 1,
  "isActive": true
}
```

---

### 3.5 Popup Images (`Popup`)
Used for promotional overlays, newsletter subscription modals, and exit-intent popups.

- **Storage Folder:** `popups`
- **Database Model:** `Popup`

#### Popup Response DTO
```json
{
  "id": "popup-newsletter-01",
  "title": "10% Discount Modal",
  "type": "exit_intent",
  "headline": "Wait! Don't Miss Out",
  "body": "Subscribe today and receive 10% off your first purchase.",
  "couponCode": "WELCOME10",
  "imageUrl": "https://res.cloudinary.com/demo/image/upload/v1680000000/popups/welcome-discount.webp",
  "delaySeconds": 5,
  "isActive": true
}
```

---

### 3.6 Blog Article Featured Images (`BlogPost`)
Main hero image for content marketing articles and news.

- **Storage Folder:** `blog` or `media`
- **Database Relation:** `BlogPost.featuredImageId` referencing `MediaAsset`

#### Blog Post Response Example
```json
{
  "id": "post-audio-guide",
  "title": "Top Noise Cancelling Headphones of 2026",
  "slug": "top-noise-cancelling-headphones-2026",
  "excerpt": "A comprehensive review of active noise cancelling audio gear.",
  "featuredImage": {
    "id": "media-asset-881",
    "filename": "1700000000000_guide-hero.jpg",
    "originalFilename": "guide-hero.jpg",
    "mimeType": "image/jpeg",
    "size": 512000,
    "url": "https://res.cloudinary.com/demo/image/upload/v1680000000/blog/guide-hero.jpg",
    "secureUrl": "https://res.cloudinary.com/demo/image/upload/v1680000000/blog/guide-hero.jpg",
    "publicId": "blog/guide-hero",
    "cloudinaryPublicId": "blog/guide-hero",
    "width": 1920,
    "height": 1080,
    "folder": "blog",
    "altText": "Professional reviewing headphones in studio"
  }
}
```

---

## 4. TYPESCRIPT DTOS & SERVICE INTERFACES

### 4.1 Media Asset Item DTO (`MediaAssetItem`)
```typescript
export interface MediaAssetItem {
  id: string;
  filename: string;
  originalName?: string;
  originalFilename?: string;
  mimeType: string;
  size: number;
  url: string;
  secureUrl?: string;
  publicId?: string;
  cloudinaryPublicId?: string;
  width?: number;
  height?: number;
  folder?: string;
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}
```

### 4.2 Upload Media Result (`UploadedMediaResult`)
```typescript
export interface UploadedMediaResult {
  id: string;
  url: string;
  secureUrl: string;
  publicId: string | null;
  cloudinaryPublicId: string | null;
  originalFilename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  folder: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}
```

---

## 5. API ENDPOINTS REFERENCE

### 5.1 Media Asset Upload & Management

| Endpoint | Method | Permission | Payload / Query | Description |
|----------|--------|------------|-----------------|-------------|
| `/api/v1/media` | `GET` | `Media:Read` | `?folder=products&search=headphone` | Search & list media assets |
| `/api/v1/media/upload` | `POST` | `Media:Write` | `multipart/form-data` (`file`, `folder`, `altText`, `isPrimary`) | Upload single image |
| `/api/v1/media/upload-multiple` | `POST` | `Media:Write` | `multipart/form-data` (`files`, `folder`) | Batch upload up to 10 images |
| `/api/v1/media/:id` | `PUT` | `Media:Write` | `multipart/form-data` (`file`, `folder`) | Replace asset in-place |
| `/api/v1/media/:id` | `DELETE` | `Media:Delete` | None | Delete asset from Cloudinary & DB |

---

### 5.2 Product Gallery Operations

#### Set Primary Product Image
`PUT /api/v1/media/products/:productId/primary/:imageId`
- Sets `isPrimary: true` for the specified image and resets `isPrimary: false` for all other images belonging to the product.

#### Reorder Product Gallery
`PUT /api/v1/media/products/:productId/reorder`
- **Request Body:**
```json
{
  "imageIds": ["img-901-882", "img-901-883", "img-901-884"]
}
```
- Updates `sortOrder` index sequentially for gallery sorting.

---

## 6. DELETION & CASCADING LIFECYCLE

When calling `MediaService.deleteAsset(assetIdOrPublicId)`:

1. System looks up `MediaAsset` by `id`, `publicId`, or `cloudinaryPublicId`.
2. If Cloudinary credentials are active and `publicId` is non-local, `cloudinary.uploader.destroy(publicId)` deletes the asset from the Cloudinary CDN bucket.
3. Deletes `MediaAsset` record from PostgreSQL.
4. Cascades deletion across domain models (`ProductImage`, `CategoryImage`, `BrandImage`).

---

*End of Cloudinary & Media System Architecture Reference.*
