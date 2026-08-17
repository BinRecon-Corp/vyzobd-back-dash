# Storefront Content Delivery & Homepage Audit (`README_HOMEPAGE_CONTENT_AUDIT.md`)

## 1. Problem Statement
While marketing banners, popups, promotions, campaigns, and coupons can be successfully created and managed in the Admin Panel, the Storefront homepage fails to display:
* Homepage Banners & Hero Sliders
* Promotional Popups
* Active Storewide Promotions
* Active Marketing Campaigns
* Active Public Coupon Listings
* CMS Blocks & Announcement Bars

---

## 2. Core Architectural Mismatches

Our physical code-tracing audit has pinpointed **one central systemic flaw**:
> **There is a total disconnection between the Admin Control Plane (which writes content to the database) and the Public Storefront API (which is missing the corresponding query endpoints entirely).**

### A. Missing Routes & Controllers
While admin routes exist under `/api/banners`, `/api/popups`, etc., there are **zero** public equivalents registered under `/api/storefront/v1/`.
* Next.js Storefront developers have no public endpoints to fetch sliders, announcement bars, featured popups, or current promotions.

### B. Incomplete Public Setting Service
The storefront configuration endpoint (`GET /api/storefront/v1/settings`) only queries specialized tables (`BrandingSetting`, `SEOSetting`, `AnalyticsSetting`), completely bypassing the generic `Setting` model where layout announcements and key-value feature blocks are stored.

---

## 3. Final Content Delivery Matrix

This table summarizes the physical readiness of each content delivery component from the Database to the Front-End consumer:

| Content Component | Admin Panel Status | Database Status | Storefront API Status | DTO Mapper Status | Frontend Ready Status | Component Audit Rating |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Banners / Sliders** | **PASS** | **PASS** | **FAIL** | **FAIL** | **FAIL** | ❌ **FAIL** |
| **Popups** | **PASS** | **PASS** | **FAIL** | **FAIL** | **FAIL** | ❌ **FAIL** |
| **Promotions** | **PASS** | **PASS** | **FAIL** | **FAIL** | **FAIL** | ❌ **FAIL** |
| **Coupons (Public list)** | **PASS** | **PASS** | **FAIL** | **FAIL** | **FAIL** | ❌ **FAIL** |
| **Marketing Campaigns** | **PASS** | **PASS** | **FAIL** | **FAIL** | **FAIL** | ❌ **FAIL** |
| **CMS Pages / Custom Blocks**| **PASS** | **PASS** | **PARTIAL** | **FAIL** | **FAIL** | ⚠️ **PARTIAL** |
| **Announcement Bars / Settings**| **PASS** | **PASS** | **FAIL** | **FAIL** | **FAIL** | ❌ **FAIL** |

---

## 4. Structural Verification Checklist & Physical Paths

### 1. Database Level (Prisma Schema)
* Models declared and verified in `/prisma/schema.prisma`:
  - `Banner` (Line 584) - Includes `desktopImage`, `mobileImage`, `priority`, `isActive`, `deletedAt`.
  - `Popup` (Line 600) - Includes `type`, `headline`, `delaySeconds`, `isActive`, `deletedAt`.
  - `Promotion` (Line 548) - Includes `type`, `discountType`, `rules`, `isActive`, `deletedAt`.
  - `Coupon` (Line 522) - Includes `code`, `discountType`, `isActive`, `deletedAt`.
  - `MarketingCampaign` (Line 569) - Includes `status`, `scheduledAt`, `deletedAt`.
  - `Page` (Line 654) - Includes `slug`, `content`, `status`, `pageType`.
  - `Setting` (Line 1332) - Includes `group`, `key`, `value`, `isPublic`.

### 2. Service Level (Missing Storefront Content Services)
* `/src/backend/services/storefront/content.service.ts` only implements standard reading hooks for `Page`, `BlogPost`, and `FAQ`.
* It completely lacks query logic, status checks, and date range validations for `Banner`, `Popup`, `Promotion`, or `MarketingCampaign`.

### 3. Controller Level (Missing Storefront Handlers)
* No files or controller methods exist in `/src/backend/controllers/storefront/` to retrieve Banners, Popups, Promotions, or Marketing Campaigns.

### 4. Route Level (Missing Storefront Mounts)
* `/server.ts` mounts storefront sub-routers, but none are registered to distribute homepage banners, promotions, popups, or coupons.

---

## 5. Strategic Fix Recommendations

To transition all elements to **PASS**, developers must implement:
1. **Public Storefront Controllers**: Establish public reading controllers inside `/src/backend/controllers/storefront/` with unified filters.
2. **Date and Status Scoping**: Filter all public-facing queries strictly by:
   - `isActive = true`
   - `deletedAt = null`
   - `startDate <= now <= endDate` (where applicable)
3. **Register Storefront Routers**: Mount `/banners`, `/popups`, and `/promotions` in `storefrontRouter` inside `server.ts`.
