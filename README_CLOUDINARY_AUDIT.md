# Cloudinary Codebase Audit Report

## 1. Executive Summary
This audit identifies all image, logo, media, and upload references across the application models, API endpoints, backend services, and React admin components.

---

## 2. Image Fields Audit

### 2.1 Product Image Fields
- `ProductImage.imageUrl` (String) - Direct image asset URL
- `ProductImage.url` (String) - Backwards-compatible image URL
- `ProductImage.publicId` (String?) - Cloudinary asset ID
- `Product.ogImage` (String?) - Social preview thumbnail URL
- `ProductVariant.images` - Relation to `ProductImage`

### 2.2 Category Image Fields
- `Category.image` (String?) - Primary category banner / icon URL

### 2.3 Brand Logo Fields
- `Brand.logoUrl` (String?) - Brand logo URL

### 2.4 CMS Image Fields
- `BlogPost.featuredImageId` (String?) - Relation to `MediaAsset`
- `SeoMetadata.ogImage` (String?) - OpenGraph preview image URL
- `GlobalSeoSettings.defaultOgImage` (String?) - Default site social preview image URL

### 2.5 Banner Image Fields
- `Banner.desktopImage` (String) - Desktop banner hero image URL
- `Banner.mobileImage` (String?) - Mobile banner responsive image URL

### 2.6 Popup Image Fields
- `Popup.imageUrl` (String?) - Promotional popup modal image URL

### 2.7 Settings Logo & Favicon Fields
- `BrandingSetting.logoUrl` (String?) - Main company brand logo URL
- `BrandingSetting.faviconUrl` (String?) - Browser favicon icon URL
- `BrandingSetting.adminPanelLogo` (String?) - Admin dashboard header logo URL
- `BrandingSetting.invoiceLogo` (String?) - Printable invoice header logo URL
- `SEOSetting.ogImage` (String?) - Default site OpenGraph image
- `SEOSetting.twitterImage` (String?) - Default Twitter card image

---

## 3. Existing Media Module & Upload Endpoints Audit

### 3.1 Media Services & Controllers
- `src/backend/services/product-media.service.ts`
- `src/backend/services/media-library.service.ts`
- `src/backend/controllers/product-media.controller.ts`
- `src/backend/controllers/media-library.controller.ts`

### 3.2 Upload & Media Routes
- `POST /api/v1/products/:id/images` - Upload product image / thumbnail
- `DELETE /api/v1/products/:id/images/:imageId` - Delete product image
- `PUT /api/v1/products/:id/images/reorder` - Reorder product gallery images
- `PUT /api/v1/products/:id/images/:imageId/primary` - Set primary product image
- `POST /api/v1/media-library/upload` - General media library asset upload
- `GET /api/v1/media-library` - Query & filter uploaded media assets
- `DELETE /api/v1/media-library/:id` - Delete media asset

---

## 4. Summary & Target Refactoring Strategy
All uploads will route through a unified `CloudinaryService` and `MediaService` wrapping `@google/genai` / `cloudinary` SDK with strict MIME type validation (`jpg`, `jpeg`, `png`, `webp`, `svg`), file size limits (`10MB`), and automatic Prisma model synchronization (`MediaAsset`, `ProductImage`, `CategoryImage`, `BrandImage`).
