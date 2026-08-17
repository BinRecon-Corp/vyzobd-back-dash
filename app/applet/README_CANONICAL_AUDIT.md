# Canonical URL & Duplicate URL Audit

## Overview
Audit of canonical URL generation, field storage, override capabilities, and duplicate URL risk management across the storefront backend.

## 1. Canonical Storage & Overrides
- Both `Product` and `Category` models support custom `canonicalUrl` overrides in the database.
- Admin creation and editing forms accept explicit custom canonical URLs for products and categories.

## 2. Dynamic Fallback Generation
- When `canonicalUrl` is null in the database, backend services and SEO endpoints construct the canonical URL dynamically:
  - **Products:** `<BASE_URL>/products/<slug>`
  - **Categories:** `<BASE_URL>/categories/<slug>`
  - **Brands:** `<BASE_URL>/brands/<slug>`
- `getBaseUrl(host)` uses `process.env.STOREFRONT_BASE_URL` or falls back to `https://<req.get('host')>`.

## 3. Duplicate Content Risk Mitigation
- **Slugs:** Enforced `@unique` constraint at the database layer for product and category slugs.
- **Query Parameter Handling:** Search and filter parameters do not modify canonical URLs in SEO metadata responses, ensuring paginated or filtered views point back to the clean canonical canonical path.
- **Trailing Slashes:** Base URL resolution strips trailing slashes (`replace(/\/+$/, "")`) to maintain clean URL structures.

## Verification Status: PASS
Canonical URLs are consistently formed, support custom overrides, and effectively prevent duplicate content penalties.
