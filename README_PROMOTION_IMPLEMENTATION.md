# Promotion API Implementation (`README_PROMOTION_IMPLEMENTATION.md`)

## Implementation Status: PASS

## Files Changed/Created
- `src/backend/dtos/storefront/types.ts`: Added `StorefrontPromotion`.
- `src/backend/dtos/storefront/mappers.ts`: Added `mapPromotionToStorefrontDTO`.
- `src/backend/services/storefront/content.service.ts`: Added `getActivePromotions()`.
- `src/backend/controllers/storefront/home.controller.ts`: Added `getPromotions`.
- `src/backend/routes/storefront/promotion.routes.ts`: Registered `GET /`.
- `server.ts`: Mounted `/api/storefront/v1/promotions`.

## Endpoint Details
**Route:** `GET /api/storefront/v1/promotions`

**Database Query Rules:**
- `isActive = true`
- `deletedAt = null`
- Date checking: Strict bounds on `startDate` and `endDate`.

**DTO Sanitization:**
Excluded the `rules` JSON string completely from the storefront endpoint, blocking internal threshold logics and brand associations from leaking to the DOM.

## API Example
```json
{
  "status": "success",
  "data": [
    {
      "id": "abc",
      "name": "Summer Clearance",
      "type": "category_discount",
      "discountType": "percentage",
      "discountValue": 25,
      "priority": 1,
      "isStackable": false
    }
  ]
}
```
