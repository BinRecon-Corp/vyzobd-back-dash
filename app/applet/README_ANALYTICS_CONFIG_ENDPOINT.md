# Analytics Config Endpoint Audit

This document details the newly created dedicated storefront endpoint for loading tracking configuration.

## Endpoint Details
- **Route**: `GET /api/storefront/v1/analytics/config`
- **Controller**: `src/backend/controllers/storefront/analytics.controller.ts`
- **Service**: `src/backend/services/storefront/analytics.service.ts`

## Response Specification
The endpoint returns a clean, client-safe JSON payload designed exclusively for storefront tracking script initialization:

```json
{
  "status": "success",
  "data": {
    "ga4MeasurementId": "G-TEST123456",
    "gtmContainerId": "GTM-TEST12345",
    "metaPixelId": "123456789",
    "googleAdsId": "AW-123456",
    "enableAnalytics": true
  }
}
```

## Security & Architecture Rules
1. **Isolated Endpoint**: Serves tracking configuration independently without bundling heavy SEO or branding assets.
2. **Strict Security Isolation**: Excludes all private server-side credentials (`ga4ApiSecret`, database passwords, secret keys).
3. **Storefront Usage**: Consumed by the Storefront frontend script loader to dynamically mount Google Tag Manager, Google Analytics 4, Meta Pixel, and Google Ads tags.

## Verification Status
- **Endpoint Route**: VERIFIED (`200 OK`)
- **JSON Structure**: VERIFIED
- **Secret Protection**: VERIFIED
