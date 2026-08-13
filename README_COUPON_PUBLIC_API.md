# Public Coupon API Implementation (`README_COUPON_PUBLIC_API.md`)

## Implementation Status: PASS

## Files Changed/Created
- `src/backend/dtos/storefront/types.ts`: Added `StorefrontCoupon`.
- `src/backend/dtos/storefront/mappers.ts`: Added `mapCouponToStorefrontDTO`.
- `src/backend/services/storefront/content.service.ts`: Added `getPublicCoupons()`.
- `src/backend/controllers/storefront/home.controller.ts`: Added `getCoupons`.
- `src/backend/routes/storefront/coupon.routes.ts`: Registered `GET /`.
- `server.ts`: Mounted `/api/storefront/v1/coupons`.

## Endpoint Details
**Route:** `GET /api/storefront/v1/coupons`

**Database Query Rules:**
- `isActive = true`
- `deletedAt = null`
- Date checking: `validFrom <= now` AND `validUntil >= now`.
- Raw Capacity Check: `OR: [ { usageLimit: null }, { AND: [ { usageLimit: { not: null } }, { usedCount: { lt: prisma.coupon.fields.usageLimit } } ] } ]` ensures burned-out codes never surface.

**DTO Sanitization:**
Excluded strict system limitations like `applicableCategories`, `applicableProducts`, `usageLimit`, and `usedCount` to prevent scraping or business intelligence leakage.

## API Example
```json
{
  "status": "success",
  "data": [
    {
      "id": "123",
      "code": "WELCOME10",
      "discountType": "percentage",
      "discountValue": 10,
      "validUntil": "2027-01-01T00:00:00Z",
      "minOrderAmount": 50
    }
  ]
}
```
