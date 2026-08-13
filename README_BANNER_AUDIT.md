# Banner & Sliders Audit Report (`README_BANNER_AUDIT.md`)

## 1. Physical Trace Summary
* **Component Description**: Homepage hero sliders, promotional banners, and category hero banners.
* **Component Rating**: ❌ **FAIL** (Not delivered to storefront).

### Trace Map
```
  [Admin Controller] -> Writes `Banner` database record (OK)
  [Database: pgSQL]  -> Correctly persists `Banner` table (OK)
  [Storefront API]   -> NO ENDPOINT EXISTS (FAIL)
  [DTO Mapper]       -> NO DTO MAPPER EXISTS (FAIL)
  [Next.js Client]   -> Render is blocked (FAIL)
```

---

## 2. Core Findings & Root Cause

* **Admin Implementation**: Banners are managed fully via `/src/backend/controllers/banner.controller.ts` and `/src/backend/routes/banner.routes.ts`.
* **Storefront Implementation**: There is **no public router or controller** to serve banners. The file `src/backend/services/storefront/content.service.ts` contains no logic to fetch the `Banner` model.

---

## 3. Database vs Storefront DTO Specifications

### Verified Database Fields
The `Banner` model is defined in `/prisma/schema.prisma` with these attributes:
* `id` (String, Primary Key)
* `title` (String)
* `desktopImage` (String)
* `mobileImage` (String, Optional)
* `linkUrl` (String, Optional)
* `ctaText` (String, Optional)
* `startDate` (DateTime, Optional)
* `endDate` (DateTime, Optional)
* `priority` (Int, Default: 0)
* `isActive` (Boolean, Default: true)
* `deletedAt` (DateTime, Optional)

### Missing Storefront DTO Structure
A public `StorefrontBanner` interface must be created under `/src/backend/dtos/storefront/types.ts` to protect internal timestamps:
```typescript
export interface StorefrontBanner {
  id: string;
  title: string;
  desktopImage: string;
  mobileImage: string | null;
  linkUrl: string | null;
  ctaText: string | null;
  priority: number;
}
```

---

## 4. Operational Filtering & Business Rules
To safely serve banners on the storefront homepage, queries must be scoped to the following business rules:
1. **Soft Deletion Check**: `deletedAt` must be `null`.
2. **Active State Verification**: `isActive` must be `true`.
3. **Date Bounds Verification**:
   - Current time must be greater than or equal to `startDate` (if `startDate` is configured).
   - Current time must be less than or equal to `endDate` (if `endDate` is configured).
4. **Ordering Priority**: Banners must be ordered by `priority` descending, followed by `createdAt` descending.

---

## 5. Physical Code Corrections

To enable homepage banners, add these components:

### A. Service Method (`src/backend/services/storefront/content.service.ts`)
```typescript
async getActiveBanners() {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      OR: [
        { startDate: null },
        { startDate: { lte: now } }
      ],
      AND: [
        { OR: [{ endDate: null }, { endDate: { gte: now } }] }
      ]
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "desc" }
    ]
  });
}
```

### B. Controller & Route Registration (`server.ts`)
Mount a public endpoint inside the storefront router block:
```typescript
storefrontRouter.get("/banners", async (req, res) => {
  const banners = await storefrontContentService.getActiveBanners();
  res.json({
    status: "success",
    data: banners.map(b => ({
      id: b.id,
      title: b.title,
      desktopImage: b.desktopImage,
      mobileImage: b.mobileImage,
      linkUrl: b.linkUrl,
      ctaText: b.ctaText
    }))
  });
});
```
