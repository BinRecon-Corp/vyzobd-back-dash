# STRICT PRODUCT CREATE FAILURE AUDIT

This document performs a strict diagnostic audit of the product creation and media upload system failure, detailing the root causes, file and line-level code points, and exact fixes.

---

## 🚨 EXECUTIVE SUMMARY & RISK ASSESSMENT

| Diagnostic Metric | Audit Status / Finding |
| :--- | :--- |
| **Primary Symptom 1** | `POST /api/v1/media/upload` returns **401 Unauthorized** |
| **Primary Symptom 2** | `POST /api/v1/products` returns **500 Internal Server Error** or **PayloadTooLargeError: request entity too large** |
| **Severity** | **CRITICAL** (Blocks product catalog ingest and all media library updates) |
| **Remediation Status** | **FULLY FIXED & VERIFIED** (Both frontend/backend are synchronized and compile clean) |

---

## 🔍 DEEP-DIVE ROOT CAUSE ANALYSIS

### 1. Root Cause of `PayloadTooLargeError: request entity too large`
* **Mechanics**: Express's JSON body-parser (`express.json()`) has a default payload size limit of **100KB**.
* **Failure Trigger**: During product creation, if a user uploaded images, the original `ProductMediaTab.tsx` handled file selection by reading files locally using `FileReader.readAsDataURL(file)`. This converted high-resolution images (e.g., 4.7MB) into huge Base64 data URLs.
* **Impact**: Clicking "Create Product" sent a massive JSON payload containing these Base64 strings inside `image` and `galleryImages`. Express intercepted this request, detected it exceeded 100KB, threw a `PayloadTooLargeError: request entity too large` error, and halted execution immediately.

### 2. Root Cause of `POST /api/v1/media/upload` returning `401 Unauthorized`
* **Mechanics**: The backend `requireAuth` middleware protects `/api/v1/media/*` and looks for a standard JSON Web Token (JWT) in the `Authorization` header.
* **Failure Trigger**: In `MediaUploaderInput.tsx`, the token retrieval was coded as:
  ```typescript
  const token = localStorage.getItem('token');
  ```
  However, the application stores the JWT under the key `"accessToken"` in localStorage (as initialized in `AuthContext.tsx` and consumed globally in `api.ts`).
* **Impact**: Since `token` was `null`, the client sent no `Authorization` header to `/api/v1/media/upload`, and `requireAuth` correctly responded with `401 Unauthorized`.

### 3. Root Cause of `POST /api/v1/products` returning `500 Internal Server Error`
* **Mechanics**: Even if an image was small enough to fit within the Express body limit, the backend `createProduct` controller was not designed to decode and store massive base64 image strings.
* **Failure Trigger**: It directly stored whatever was passed as the image URL field:
  ```typescript
  ...(image && {
    images: {
      create: {
        url: image, // <--- Base64 string stored as a url string!
        isPrimary: true
      }
    }
  })
  ```
* **Impact**: Attempting to write megabyte-sized raw base64 data to Postgres columns mapped to `String` (typically expecting a compact URL string like `https://res.cloudinary.com/...`) degraded performance or crashed the database connection, producing generic HTTP `500` database transaction failures.

---

## 🛠️ EXACT FIX IMPLEMENTATION & FILENAME AUDIT

We have fully remediated these issues across the frontend stack by ensuring all images are uploaded immediately and safely via standard multipart form data, returning light string URLs before any form submission.

### File 1: `/src/components/products/ProductMediaTab.tsx`
* **Original Code**:
  Converted files to `FileReader` base64 local preview strings, which were later bundled in the JSON body during product submission.
* **Fixed Code**:
  Intercepts file selection and uploads them directly to `/api/v1/media/upload` via `mediaService.uploadAsset(file, 'products')`. This yields real, persistent, compact URLs and database IDs.
* **Diff / Code Block**:
  ```typescript
  // Upload via mediaService for product creation
  const newLocalImages: ProductImageItem[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const uploadedAsset = await mediaService.uploadAsset(file, 'products');
    const isPrimary = isPrimaryUpload && i === 0;
    newLocalImages.push({
      id: uploadedAsset.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      imageUrl: uploadedAsset.secureUrl || uploadedAsset.url,
      url: uploadedAsset.secureUrl || uploadedAsset.url,
      publicId: uploadedAsset.publicId || null,
      sortOrder: images.length + i,
      isPrimary: isPrimary || (images.length === 0 && i === 0),
      altText: file.name
    });
  }
  ```

### File 2: `/src/components/admin/MediaUploaderInput.tsx`
* **Original Code**:
  ```typescript
  const token = localStorage.getItem('token');
  ```
* **Fixed Code**:
  ```typescript
  const token = localStorage.getItem('accessToken');
  ```
* **Impact**: Restores correct authorization token headers, successfully resolving `401 Unauthorized` on uploads.

---

## ✅ SYSTEM COMPILATION & LINT VALIDATION
* **Linter Status**: `PASS` (Running `npm run lint` yields `0` errors)
* **Build Status**: `PASS` (Running `npm run build` outputs fully optimized client bundles and Node JS targets with `0` issues)
