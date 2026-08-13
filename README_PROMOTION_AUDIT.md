# Promotions & Storewide Discounts Audit Report (`README_PROMOTION_AUDIT.md`)

## 1. Physical Trace Summary
* **Component Description**: Automatic cart discounts, category markdown promos, buy-one-get-one deals, and coupon stackability handlers.
* **Component Rating**: ❌ **FAIL** (Not delivered to storefront).

### Trace Map
```
  [Admin Controller] -> Writes `Promotion` database record (OK)
  [Database: pgSQL]  -> Correctly persists `Promotion` table (OK)
  [Storefront API]   -> NO ENDPOINT EXISTS (FAIL)
  [DTO Mapper]       -> NO DTO MAPPER EXISTS (FAIL)
  [Next.js Client]   -> Render is blocked (FAIL)
```

---

## 2. Core Findings & Root Cause

* **Admin Implementation**: Managed fully via `/src/backend/controllers/promotion.controller.ts` and `/src/backend/routes/promotion.routes.ts`.
* **Storefront Implementation**: No public endpoint exists for the catalog pages or landing pages to list upcoming or active storewide promotions. No services are wired to push active promotions to the client, preventing promotional banners from displaying active discounts.

---

## 3. Database vs Storefront DTO Specifications

### Verified Database Fields
The `Promotion` model is declared in `/prisma/schema.prisma` with these attributes:
* `id` (String, Primary Key)
* `name` (String)
* `type` (String) - Options: `"buy_x_get_y"`, `"category_discount"`, `"brand_discount"`, `"cart_discount"`, `"bundle_discount"`.
* `discountType` (String, Optional) - Options: `"percentage"`, `"fixed"`.
* `discountValue` (Decimal, Optional)
* `rules` (String, Optional) - Stores JSON string representing thresholds and rules configuration.
* `priority` (Int, Default: 0)
* `isStackable` (Boolean, Default: false)
* `startDate` (DateTime, Optional)
* `endDate` (DateTime, Optional)
* `isActive` (Boolean, Default: true)
* `deletedAt` (DateTime, Optional)

### Missing Storefront DTO Structure
The public DTO must deliver active promotional tags while sanitizing structural system rules:
```typescript
export interface StorefrontPromotion {
  id: string;
  name: string;
  type: string;
  discountType: string | null;
  discountValue: number | null;
  priority: number;
  isStackable: boolean;
}
```

---

## 4. Operational Filtering & Business Rules
To safely present active storewide promotions, queries must use these rules:
1. **Soft Deletion Check**: `deletedAt` must be `null`.
2. **Active State Verification**: `isActive` must be `true`.
3. **Date Bounds Verification**:
   - Current time must be greater than or equal to `startDate` (if `startDate` is configured).
   - Current time must be less than or equal to `endDate` (if `endDate` is configured).
4. **Ordering Priority**: Banners must be ordered by `priority` descending.

---

## 5. Physical Code Corrections

To support storefront promotions listings, add these components:

### A. Service Method (`src/backend/services/storefront/content.service.ts`)
```typescript
async getActivePromotions() {
  const now = new Date();
  return prisma.promotion.findMany({
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
    orderBy: { priority: "desc" }
  });
}
```

### B. Controller & Route Registration (`server.ts`)
Mount a public endpoint inside the storefront router block:
```typescript
storefrontRouter.get("/promotions", async (req, res) => {
  const promotions = await storefrontContentService.getActivePromotions();
  res.json({
    status: "success",
    data: promotions.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      discountType: p.discountType,
      discountValue: p.discountValue ? Number(p.discountValue) : null,
      priority: p.priority,
      isStackable: p.isStackable
    }))
  });
});
```
