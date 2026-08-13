# Banner API Implementation (`README_BANNER_IMPLEMENTATION.md`)

## Implementation Status: PASS

## Files Changed/Created
- `src/backend/dtos/storefront/types.ts`: Added `StorefrontBanner`.
- `src/backend/dtos/storefront/mappers.ts`: Added `mapBannerToStorefrontDTO`.
- `src/backend/services/storefront/content.service.ts`: Added `getActiveBanners()`.
- `src/backend/controllers/storefront/home.controller.ts`: Added `getBanners`.
- `src/backend/routes/storefront/banner.routes.ts`: Registered `GET /`.
- `server.ts`: Mounted `/api/storefront/v1/banners`.

## Endpoint Details
**Route:** `GET /api/storefront/v1/banners`

**Database Query Rules:**
- `isActive = true`
- `deletedAt = null`
- Date checking: `startDate <= now` (or null) AND `endDate >= now` (or null).
- Ordering: `priority DESC`, `createdAt DESC`.

**DTO Sanitization:**
Excluded admin fields such as `createdBy` and `deletedAt`. Only exposed title, links, images, and priority metrics to the storefront.

## API Example
```json
{
  "status": "success",
  "data": [
    {
      "id": "123",
      "title": "Summer Sale",
      "desktopImage": "url...",
      "mobileImage": null,
      "linkUrl": "/sale",
      "ctaText": "Shop Now",
      "priority": 10
    }
  ]
}
```
