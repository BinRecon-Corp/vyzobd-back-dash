# Analytics Code Inventory

This document provides a comprehensive audit of all analytics-related files, scripts, services, and models across the repository.

| File Path | Primary Purpose | Status | Target Scope |
| :--- | :--- | :--- | :--- |
| `prisma/schema.prisma` | Defines the `AnalyticsSetting` database table schema for persisting tracking IDs & secrets | Active | Database |
| `src/backend/services/setting.service.ts` | Admin service to read and update `AnalyticsSetting` configuration in DB | Active | Admin Backend |
| `src/backend/controllers/setting.controller.ts` | Admin controller endpoints (`getAnalytics`, `updateAnalytics`) | Active | Admin Backend |
| `src/backend/services/storefront/setting.service.ts` | Storefront public settings service (`GET /api/storefront/v1/settings/public`) | Active | Storefront Backend |
| `src/backend/routes/storefront/setting.routes.ts` | Express router exposing client-safe storefront settings & analytics config | Active | Storefront Backend |
| `src/backend/services/measurement-protocol.service.ts` | Server-side GA4 Measurement Protocol service (`trackPurchase`, `trackRefund`) sending HTTP requests to `https://www.google-analytics.com/mp/collect` | Active | Storefront/Backend |
| `src/lib/ga4.ts` | Core frontend GA4 wrapper for `window.dataLayer` pushes and `gtag` execution | Active | Storefront Frontend |
| `src/lib/ga4-ecommerce.ts` | GA4 Ecommerce event interfaces and Zod validation schemas | Active | Storefront Frontend |
| `src/hooks/useGA4.ts` | React hook providing `trackViewItem`, `trackAddToCart`, `trackPurchase`, etc. | Active | Storefront Frontend |
| `src/utils/analytics.ts` | Helper utilities for dispatching standard GA4 ecommerce events | Active | Storefront Frontend |
| `src/components/AnalyticsScriptLoader.tsx` | Dynamic loader that fetches config from Storefront API and injects GTM/GA4/Pixel scripts into DOM | Active | Storefront Frontend |
| `src/pages/Analytics.tsx` | Admin panel analytics reporting dashboard (reads metrics from API) | Active | Admin Frontend |
| `src/pages/admin/settings/Settings.tsx` | Admin settings form to configure GA4, GTM, Pixel IDs, and secrets | Active | Admin Frontend |
| `src/pages/GA4Example.tsx` | Interactive test playground page for trigger verification | Active / Demo | Admin Frontend |

## Summary of Architectural Scope
- **Admin Panel**: Strictly restricted to configuration (`Settings.tsx`) and reporting (`Analytics.tsx`). Admin panel does NOT run GTM/GA4/Pixel tracking scripts.
- **Storefront**: Reads tracking configuration from `/api/storefront/v1/analytics/config` or `/api/storefront/v1/settings/public` and executes client-side GTM/GA4/Pixel tracking.
- **Server Backend**: Dispatches Measurement Protocol events directly to GA4 on completed orders and approved refunds.
