# Homepage Aggregation API (`README_HOMEPAGE_API.md`)

## Implementation Status: PASS

## Files Changed/Created
- `src/backend/controllers/storefront/home.controller.ts`: Added `getHome`.
- `src/backend/routes/storefront/home.routes.ts`: Registered `GET /`.
- `server.ts`: Mounted `/api/storefront/v1/home`.

## Endpoint Details
**Route:** `GET /api/storefront/v1/home`

**Architecture:**
- Uses `Promise.all` to query 6 tables simultaneously (Banners, Popups, Promotions, Coupons, Campaigns, Settings).
- Eliminates N+1 request waterfalls on the client side.
- Applies DTO sanitization individually to each array before aggregating into a single JSON object.

## API Example
```json
{
  "status": "success",
  "data": {
    "banners": [],
    "popups": [],
    "promotions": [],
    "coupons": [],
    "campaigns": [],
    "announcements": []
  }
}
```
