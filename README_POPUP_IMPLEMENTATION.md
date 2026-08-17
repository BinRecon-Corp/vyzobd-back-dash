# Popup API Implementation (`README_POPUP_IMPLEMENTATION.md`)

## Implementation Status: PASS

## Files Changed/Created
- `src/backend/dtos/storefront/types.ts`: Added `StorefrontPopup`.
- `src/backend/dtos/storefront/mappers.ts`: Added `mapPopupToStorefrontDTO`.
- `src/backend/services/storefront/content.service.ts`: Added `getActivePopups(type)`.
- `src/backend/controllers/storefront/home.controller.ts`: Added `getPopups`.
- `src/backend/routes/storefront/popup.routes.ts`: Registered `GET /`.
- `server.ts`: Mounted `/api/storefront/v1/popups`.

## Endpoint Details
**Route:** `GET /api/storefront/v1/popups?type=homepage`

**Database Query Rules:**
- `isActive = true`
- `deletedAt = null`
- Filtering: Optional dynamic filtering by `type` via query string.

**DTO Sanitization:**
Excluded admin fields. Exposes structural data like `headline`, `body`, and layout configurations like `delaySeconds`.

## API Example
```json
{
  "status": "success",
  "data": [
    {
      "id": "abc",
      "title": "Welcome Overlay",
      "type": "homepage",
      "headline": "10% Off First Order",
      "body": "Sign up today",
      "couponCode": "WELCOME10",
      "imageUrl": null,
      "delaySeconds": 5
    }
  ]
}
```
