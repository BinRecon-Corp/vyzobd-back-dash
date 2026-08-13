# Coupon Campaigns & Public Codes Audit Report (`README_COUPON_AUDIT.md`)

## 1. Physical Trace Summary
* **Component Description**: Public discount code blocks, cart coupon validations, and checkout discount deductions.
* **Component Rating**: ❌ **FAIL** (For public storefront delivery and listings).

### Trace Map
```
  [Admin Controller] -> Writes `Coupon` database record (OK)
  [Database: pgSQL]  -> Correctly persists `Coupon` table (OK)
  [Storefront API]   -> NO PUBLIC LISTING ENDPOINT EXISTS (FAIL)
  [Checkout Gateway] -> `POST /checkout/coupon` validation functions (OK - PARTIAL)
  [DTO Mapper]       -> NO DTO MAPPER EXISTS (FAIL)
```

---

## 2. Core Findings & Root Cause

* **Admin Implementation**: Managed fully via `/src/backend/controllers/coupon.controller.ts` and `/src/backend/routes/coupon.routes.ts`.
* **Storefront Implementation**:
  - **Partially Functional**: The checkout pipeline implements `POST /api/storefront/v1/checkout/coupon` allowing users to apply a specific coupon code during checkout (handled by `StorefrontCheckoutService.applyCoupon`).
  - **Non-existent Public Listings**: There is **no storefront-facing listing endpoint** to expose active coupons or code badges to the homepage or header announcement bars. Customers have no way to browse active deals without receiving an external newsletter.

---

## 3. Database vs Storefront DTO Specifications

### Verified Database Fields
The `Coupon` model is declared in `/prisma/schema.prisma` with these attributes:
* `id` (String, Primary Key)
* `code` (String, Unique)
* `discountType` (String) - Options: `"fixed"`, `"percentage"`, `"free_shipping"`.
* `discountValue` (Decimal)
* `validFrom` (DateTime)
* `validUntil` (DateTime)
* `isActive` (Boolean, Default: true)
* `minOrderAmount` (Decimal, Optional)
* `maxDiscountAmount` (Decimal, Optional)
* `usageLimit` (Int, Optional)
* `usagePerCustomer` (Int, Optional)
* `usedCount` (Int, Default: 0)
* `applicableCategories` (String, Optional)
* `applicableProducts` (String, Optional)
* `applicableBrands` (String, Optional)
* `deletedAt` (DateTime, Optional)

### Missing Storefront DTO Structure
The public DTO must expose active code titles, values, and expiration dates while protecting structural system boundaries (categories/brands/uses):
```typescript
export interface StorefrontCoupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  validUntil: Date;
  minOrderAmount: number | null;
}
```

---

## 4. Operational Filtering & Business Rules
To present active code banners or public lists, queries must implement:
1. **Soft Deletion Check**: `deletedAt` must be `null`.
2. **Active State Verification**: `isActive` must be `true`.
3. **Date Bounds Verification**:
   - Current time must be greater than or equal to `validFrom`.
   - Current time must be less than or equal to `validUntil`.
4. **Usage Capacity check**: `usedCount` must be strictly less than `usageLimit` (if a limit is specified).

---

## 5. Physical Code Corrections

To support public coupons listings on the storefront, add these components:

### A. Service Method (`src/backend/services/storefront/content.service.ts`)
```typescript
async getPublicCoupons() {
  const now = new Date();
  return prisma.coupon.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      validFrom: { lte: now },
      validUntil: { gte: now },
      OR: [
        { usageLimit: null },
        { 
          AND: [
            { usageLimit: { not: null } },
            { usedCount: { lt: prisma.coupon.fields.usageLimit } } // Raw capacity check
          ]
        }
      ]
    },
    orderBy: { createdAt: "desc" }
  });
}
```

### B. Controller & Route Registration (`server.ts`)
Mount a public endpoint inside the storefront router block:
```typescript
storefrontRouter.get("/coupons", async (req, res) => {
  const coupons = await storefrontContentService.getPublicCoupons();
  res.json({
    status: "success",
    data: coupons.map(c => ({
      id: c.id,
      code: c.code,
      discountType: c.discountType,
      discountValue: Number(c.discountValue),
      validUntil: c.validUntil,
      minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null
    }))
  });
});
```
