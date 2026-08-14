# Phase 9.7 - Step 6: Frontend Consumption & Script Injection Audit Report

## Audit Scope
Inspected frontend code to verify how analytics configuration is fetched and how scripts/dataLayer events are initialized.

## Infrastructure & Helper Stack

| Module | Location | Role |
|---|---|---|
| Analytics Hook | `src/hooks/useGA4.ts` | React hook providing `trackViewItem`, `trackAddToCart`, `trackPurchase`, etc. |
| Core GA4 Wrapper | `src/lib/ga4.ts` | Manages `window.dataLayer` initialization, clearing ecommerce objects, and pushing events |
| Utility Pusher | `src/utils/analytics.ts` | Standardized event pushers for all GA4 standard ecommerce actions |
| Zod Validators | `src/lib/ga4-ecommerce.ts` | Client-side validation ensuring item IDs, names, and prices conform to GA4 specifications |

## Script Injection Pattern
When integrated with a storefront shell or Next.js app, the dynamic IDs fetched from `GET /api/storefront/v1/settings` supply:
- `gtmContainerId` -> Google Tag Manager `<script>` snippet injection in `<head>` and `<noscript>` in `<body>`
- `ga4MeasurementId` -> `gtag.js` snippet injection (`https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`)
- `facebookPixelId` -> Meta Pixel `fbq(init, id)` script injection
- `tiktokPixelId` -> TikTok Pixel `ttq.load(id)` script injection

## DataLayer Initialization
```javascript
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({ ecommerce: null }); // Clear previous state
window.dataLayer.push({
  event: "view_item",
  ecommerce: { ... }
});
```
