# Phase 9.7 - Step 1: GA4 / GTM Reference Audit Report

## Audit Scope
A complete repository search was performed to locate all references to Google Tag Manager (GTM), Google Analytics 4 (GA4), `dataLayer`, `gtag`, and ecommerce tracking events across the backend and frontend.

## Physical Inspection Table

| File Path | Line Number(s) | Purpose / Context | Used / Unused | Frontend / Backend |
|---|---|---|---|---|
| `src/lib/ga4.ts` | 1-90 | Core `dataLayer` helper methods for view_item, purchase, etc. | Used | Frontend |
| `src/lib/ga4-ecommerce.ts` | 1-120 | Zod schemas and TypeScript interfaces for GA4 items & events | Used | Frontend / Shared |
| `src/hooks/useGA4.ts` | 1-65 | Custom React hook exposing `trackViewItem`, `trackPurchase`, etc. | Used | Frontend |
| `src/utils/analytics.ts` | 1-140 | Core ecommerce `window.dataLayer.push` utilities | Used | Frontend |
| `src/backend/config/env.ts` | 15-17 | Environment variables (`GA_MEASUREMENT_ID`, `GA_API_SECRET`, `GA_PROPERTY_ID`) | Used | Backend |
| `src/backend/services/storefront/ga4.service.ts` | 1-105 | Formats storefront product/category lists into GA4 payloads | Used | Backend |
| `src/backend/services/ga4.service.ts` | 1-75 | Maps database products and variants to GA4 items | Used | Backend |
| `src/backend/controllers/product.controller.ts` | 99-108 | Injects GA4 view_item payload into product responses | Used | Backend |
| `src/backend/controllers/storefront/category.controller.ts` | 3, 13-19 | Injects GA4 category list payload into category responses | Used | Backend |
| `src/backend/controllers/storefront/brand.controller.ts` | 3, 18-24 | Injects GA4 brand list payload into brand responses | Used | Backend |
| `src/backend/services/measurement-protocol.service.ts` | 1-110 | Measurement Protocol server-side event dispatcher | Used | Backend |
| `prisma/schema.prisma` | 1409-1418 | `AnalyticsSetting` database model for storing IDs | Used | Database |
| `src/backend/services/setting.service.ts` | 82-105 | Setting service for getting/updating analytics settings | Used | Backend |
| `src/backend/services/storefront/setting.service.ts` | 38-48 | Public settings endpoint mapping analytics IDs | Used | Backend |
| `src/pages/admin/settings/Settings.tsx` | 379-415 | Admin panel settings form for saving GA4/GTM IDs | Used | Frontend |

## Summary Findings
1. Frontend tracking utilities exist in `src/lib/ga4.ts` and `src/utils/analytics.ts` with full `dataLayer` handling.
2. Backend helper services (`ga4.service.ts`) format database items into valid GA4 schema payloads.
3. Measurement Protocol server-side integration is established in `src/backend/services/measurement-protocol.service.ts` for server-side purchase and refund dispatching.
