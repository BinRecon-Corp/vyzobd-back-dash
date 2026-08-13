# API Response Standardization Audit & Patch Report

As requested by the engineering leadership, we have physically audited and successfully patched the storefront backend to enforce a rigid, predictable, and enterprise-ready API response contract. This ensures that frontend developers building the Next.js Storefront can consume all endpoints with 100% confidence, using identical types and response parsing interceptors.

---

## 1. Current (Pre-Audit) API Formats

Prior to this audit and patching cycle, the storefront APIs used multiple inconsistent payload patterns:

### A. Raw Pagination & Meta (e.g., Products, Search)
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  },
  "ga4": { ... }
}
```

### B. Boolean Success Mappings (e.g., Categories, Brands, Blog)
```json
{
  "success": true,
  "data": { ... },
  "meta": {}
}
```

### C. Standard Success Wrapper with Nested Object (e.g., Cart, Checkout)
```json
{
  "status": "success",
  "data": {
    "cart": { ... }
  }
}
```

### D. Error Formatting Divergence
Validation errors returned `success: false` with custom `details` properties, while server crashes returned raw `{ success: false, message: "Internal Server Error" }` without unified status mappings.

---

## 2. New Standardized API Contract

All storefront API endpoints have been unified to output the following strict schemas:

### A. Success Standard Response
```json
{
  "status": "success",
  "message": "User-friendly message (if applicable or empty string)",
  "data": {
    // Exact payload object or array
  },
  "pagination": {
    // Only present for paginated list endpoints, otherwise empty object {}
    "total": 120,
    "page": 1,
    "limit": 20,
    "totalPages": 6
  }
}
```

### B. Error Standard Response
```json
{
  "status": "error",
  "message": "Concise high-level description of the error",
  "errors": [
    // Validation details or structured list of operational error objects
    {
      "field": "email",
      "message": "Email is already in use"
    }
  ]
}
```

---

## 3. Physical Patches Applied (Files Changed)

To achieve 100% airtight contract compliance without introducing manual code drift across 22 individual controller files, we implemented an elegant, high-performance Express response-formatting middleware layer coupled with centralized error-handling adjustments:

1. **`src/backend/middlewares/storefront/responseFormatter.ts`** (CREATED)
   - Automatically intercepts and formats all standard JSON response payloads on the `/api/storefront/v1` routes.
   - Preserves analytics tracking parameters (e.g., `ga4`) by merging them securely into the structured `data` block.
   - Detects paginated records to map `meta` or `pagination` seamlessly.
   - Excludes Google Merchant Center XML/JSON feeds (`/merchant/feed`) dynamically to avoid breaking third-party ingestion crawlers.

2. **`src/backend/middlewares/errorHandler.ts`** (MODIFIED)
   - Refactored storefront boundary handlers to map Zod and system errors directly into the new `{ status: "error", message, errors: [...] }` contract, obfuscating all raw database traces.

3. **`server.ts`** (MODIFIED)
   - Registered the `responseFormatter` middleware on `storefrontRouter` right after the storefront loggers, ensuring it captures all downstream routes safely.

---

## 4. Breaking Changes

- **Root Keys Removed**: `success` boolean is removed in favor of `status: "success" | "error"`.
- **Pagination Uniformity**: No endpoint will return pagination values at the root or nested in alternative properties like `meta`. They are consistently grouped under `pagination`.
- **Response Shape Shift**: Bare array responses or responses missing the `status` block are automatically enveloped inside `{ status, message, data, pagination }`.

---

## 5. Next.js Storefront Impact

This standardization simplifies the Next.js frontend SDK implementation:
- **Axios / Fetch Interceptors**: Developers can declare a single TypeScript interface for response handling:
  ```typescript
  export interface ApiResponse<T> {
    status: "success" | "error";
    message: string;
    data: T;
    pagination?: {
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    };
    errors?: Array<{ field?: string; message: string }>;
  }
  ```
- **Unified Query Hooks**: All infinite scrolling and paginated listing hooks (e.g., TanStack Query) can rely on a single, uniform mapping path to retrieve total records and current cursors.
