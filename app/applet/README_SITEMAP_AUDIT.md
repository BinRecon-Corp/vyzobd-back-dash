# Sitemap & Robots.txt Audit

## Overview
Audit of XML Sitemap generation and `robots.txt` delivery endpoints for search engine crawlers and headless storefront indexing.

## 1. Sitemap Endpoint (`GET /api/storefront/v1/sitemap`)
- **Controller:** `src/backend/controllers/storefront/sitemap.controller.ts` (`getSitemap`)
- **Response Format:** `application/xml`
- **Included Resources:**
  - Root / Home URL (`/`)
  - Active Products (`/products/:slug` or custom `canonicalUrl`)
  - Active Categories (`/categories/:slug` or custom `canonicalUrl`)
  - Published CMS Pages (`/pages/:slug`)
- **Metadata Included:**
  - `<loc>`: Fully qualified canonical URL
  - `<lastmod>`: ISO 8601 timestamp (`updatedAt`)
  - `<changefreq>`: Frequency hint (`daily`, `weekly`, `monthly`)
  - `<priority>`: Numerical priority ranking (`1.0`, `0.8`, `0.7`, `0.5`)

## 2. Robots.txt Endpoint (`GET /api/storefront/v1/robots.txt`)
- **Controller:** `src/backend/controllers/storefront/sitemap.controller.ts` (`getRobotsTxt`)
- **Response Format:** `text/plain`
- **Directives:**
  - `User-agent: *`
  - `Allow: /`
  - `Disallow: /checkout/`
  - `Disallow: /account/`
  - `Disallow: /cart/`
  - `Sitemap: <BASE_URL>/api/storefront/v1/sitemap`

## 3. Server Integration (`server.ts`)
- Both endpoints are mounted directly on `storefrontRouter` at `/sitemap` and `/robots.txt`.
- Handlers automatically resolve base host dynamically from `process.env.STOREFRONT_BASE_URL` or HTTP `Host` header.

## Verification Status: PASS
XML Sitemap and `robots.txt` are properly configured, dynamically generated from live database entities, and served with appropriate content types.
