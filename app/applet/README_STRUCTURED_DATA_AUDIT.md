# Structured Data (JSON-LD) Readiness Audit

## Overview
Evaluation of backend payload completeness for generating schema.org JSON-LD structured data on Next.js storefront pages.

## 1. Product Schema Readiness (`https://schema.org/Product`)
The product API (`/api/storefront/v1/products/:slug` and `/api/storefront/v1/seo/product/:slug`) exposes all necessary fields for rich snippet generation:
- `name`: Product title
- `description`: Plain text description
- `image`: Primary image and full image gallery
- `sku` / `gtin` / `mpn`: Global trade identifiers
- `brand`: Brand object with `name`
- `category`: Category object with `name` and `slug`
- `offers`: `price`, `priceCurrency` (USD), `availability` (`inStock` / `stock`), `itemCondition` (`condition`)

## 2. Category & Breadcrumb Schema Readiness (`https://schema.org/BreadcrumbList`)
- Category objects include `parentId`, `parent`, and `children` arrays for building breadcrumb hierarchies.
- Enables Next.js storefront to build `BreadcrumbList` schema containing item lists from home to leaf categories.

## 3. Organization Schema Readiness (`https://schema.org/Organization`)
- Merchant/settings endpoints (`/api/storefront/v1/settings` and `/api/storefront/v1/merchant`) expose organization name, logo, contact points, and social profiles.

## Verification Status: PASS
Backend payloads provide 100% of the required data points for constructing compliant JSON-LD structured data.
