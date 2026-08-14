# Storefront Analytics Settings API Audit

This document details the security and functional audit of the storefront settings API endpoints (`GET /api/storefront/v1/settings` and `GET /api/storefront/v1/settings/public`).

## Endpoints Audited
- `GET /api/storefront/v1/settings`
- `GET /api/storefront/v1/settings/public`

## Security & Payload Structure

### Safe Client Payload Format
The API responds with client-safe tracking configuration:

```json
{
  "status": "success",
  "data": {
    "branding": { ... },
    "seo": { ... },
    "analytics": {
      "googleAnalyticsId": "G-TEST123456",
      "ga4MeasurementId": "G-TEST123456",
      "googleTagManagerId": "GTM-TEST12345",
      "gtmContainerId": "GTM-TEST12345",
      "facebookPixelId": "123456789",
      "metaPixelId": "123456789",
      "tiktokPixelId": "TT-12345",
      "googleAdsId": "AW-123456",
      "hotjarId": "HJ-123",
      "enableAnalytics": true
    }
  }
}
```

### Security Compliance Verification
1. **Secret Credentials Omission**: `ga4ApiSecret` is **strictly excluded** from the response payload to protect server-side Measurement Protocol authorization.
2. **Standardized Aliases**: Includes both exact property names (`googleAnalyticsId`, `googleTagManagerId`, `facebookPixelId`) and common client aliases (`ga4MeasurementId`, `gtmContainerId`, `metaPixelId`).
3. **Toggle Respect**: Exposes `enableAnalytics` boolean flag so clients can disable script loading dynamically.

## Verification Status
- **Client-Safe Output**: VERIFIED
- **Secret Protection (`ga4ApiSecret` Omitted)**: VERIFIED
- **Endpoint Availability**: VERIFIED (`GET /api/storefront/v1/settings` & `GET /api/storefront/v1/settings/public`)
