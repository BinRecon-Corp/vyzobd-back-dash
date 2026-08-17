# Enterprise Product Media Management System

This document outlines the architecture, setup, API endpoints, UI features, and migration steps for the Enterprise Product Media Management system.

---

## 1. Overview

The Enterprise Product Media Management system replaces manual image URL handling with a robust Cloudinary-backed upload, storage, and media gallery system for products.

### Key Capabilities
- **Cloudinary SDK Integration**: Automated upload, Cloudinary public ID tracking, and remote deletion.
- **Strict File Validation**: Enforces image type (`image/jpeg`, `image/jpg`, `image/png`, `image/webp`) and size limits (`<= 5MB`).
- **Prisma ProductImage Model**: Relational structure supporting ordered product image galleries with a designated primary thumbnail.
- **Admin Media Tab UI**: Rich interactive Media Tab with drag-and-drop sorting, primary image toggling, gallery previews, and deletion controls.
- **Automatic Legacy Data Migration**: Migrates existing string image URL fields (`image`, `images`, `galleryImages`) into structured `ProductImage` database records seamlessly on server boot.

---

## 2. Cloudinary Integration

### Environment Configuration
The system uses the Cloudinary SDK via `@google/genai` or standard `cloudinary` v2 package configured through environment variables in `.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Core Operations (`src/backend/services/cloudinary.service.ts`)
- `uploadToCloudinary(fileBuffer, mimeType, folder)`: Uploads image buffer to Cloudinary and returns secure URL and public ID.
- `deleteFromCloudinary(publicId)`: Deletes image asset from Cloudinary by public ID.
- `validateImageFile(fileBuffer, mimeType)`: Enforces 5MB size limit and allowed MIME types.

---

## 3. Database Schema

### Prisma Model (`prisma/schema.prisma`)

```prisma
model ProductImage {
  id        String   @id @default(uuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  imageUrl  String
  publicId  String?
  altText   String?
  sortOrder Int      @default(0)
  isPrimary Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([productId])
  @@index([isPrimary])
}
```

### Relation
- **Product (1) : (N) ProductImage**
- Deleting a product automatically cascades and deletes associated `ProductImage` records and Cloudinary assets.

---

## 4. REST API Endpoints

All media endpoints are mounted under `/api/v1/products`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/v1/products/:id/images` | Upload single or thumbnail image (multipart/form-data) |
| **DELETE** | `/api/v1/products/:id/images/:imageId` | Delete an image record and remove from Cloudinary |
| **PUT** | `/api/v1/products/:id/images/reorder` | Update gallery display order (body: `{ imageIds: string[] }`) |
| **PUT** | `/api/v1/products/:id/images/:imageId/primary` | Set designated image as primary thumbnail |

---

## 5. File Validation Rules

- **Allowed Extensions & MIME Types**: `.jpg`, `.jpeg`, `.png`, `.webp` (`image/jpeg`, `image/jpg`, `image/png`, `image/webp`)
- **Maximum File Size**: 5MB (`5 * 1024 * 1024` bytes)
- **Error Handling**: API returns standard HTTP 400 Bad Request if file size exceeds limit or format is disallowed.

---

## 6. Admin UI Features (`src/components/products/ProductMediaTab.tsx`)

Located inside the **Media Tab** of Product Create/Edit forms:
- **Thumbnail Dropzone**: Direct drag-and-drop or file pick for primary thumbnail.
- **Gallery Dropzone**: Multi-file dropzone for gallery uploads.
- **Primary Image Badge & Toggle**: Visual indication of active primary thumbnail with 1-click "Make Primary" toggle.
- **Drag & Drop Reordering**: Reorder gallery images using native HTML5 drag-and-drop or arrow controls.
- **Delete Action**: Instant confirmation and deletion of images from database and Cloudinary.
- **Validation Alerts**: User-friendly feedback for invalid format or size errors.

---

## 7. Migration

Legacy product string fields (`image`, `images`, `galleryImages`) are automatically converted to `ProductImage` records on server startup via `ProductMediaService.migrateExistingProductMedia()`.

---

## 8. Build & Verification

Run the following commands to verify system health:

```bash
# Validate Prisma schema
npx prisma validate

# Generate Prisma Client
npx prisma generate

# Typecheck codebase
npm run lint

# Build full production bundle
npm run build
```
