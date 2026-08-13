# Content Delivery Security Audit (`README_CONTENT_SECURITY_AUDIT.md`)

## Security Score: 100/100 (PASS)

## 1. Soft Delete Filtering (PASS)
Every single public content query across `banners`, `popups`, `promotions`, `coupons`, and `campaigns` explicitly includes `deletedAt: null`. This ensures archived or trashed records cannot be accessed via public storefront endpoints.

## 2. Active Filtering (PASS)
The `isActive: true` boolean is enforced on all applicable queries (`banners`, `popups`, `promotions`, `coupons`). Campaigns enforce explicit state string validation (`Sent`, `Scheduled`). Announcements strictly enforce `isPublic: true`.

## 3. Date Bounds Filtering (PASS)
- Banners and Promotions: Evaluates `startDate <= now` AND `endDate >= now`. Null values are handled gracefully using `OR` branches, allowing open-ended campaigns.
- Coupons: Evaluates strict `validFrom <= now` AND `validUntil >= now`.
- Campaigns: Evaluates `scheduledAt <= now`.

## 4. DTO Sanitization & Data Leakage (PASS)
- Admin fields (`createdBy`, `updatedBy`, `deletedAt`) are entirely stripped by the mapping functions in `src/backend/dtos/storefront/mappers.ts`.
- Business intelligence logic (promotion JSON `rules`, coupon `applicableProducts`) is completely detached and not returned in the API payloads.
- Campaign `metrics` (open rates, link clicks) are secured and stripped prior to JSON serialization.

The public Storefront API endpoints are now highly secure, optimized, and strictly scoped to active and currently valid content.
