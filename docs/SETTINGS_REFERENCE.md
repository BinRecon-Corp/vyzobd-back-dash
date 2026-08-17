# STORE CONFIGURATION & SETTINGS MODULE REFERENCE

**Module Version:** v1  
**Admin Endpoints Path:** `/api/v1/settings`  
**Public Storefront Path:** `/api/storefront/v1/settings/public`  
**Required Permissions:**  
- Read Operations: `Settings:read`  
- Write/Update Operations: `Settings:write`  

---

## 1. MODULE OVERVIEW & ARCHITECTURE

The Settings module governs all merchant configuration parameters across seven specialized domain settings groups and dynamic key-value entries. Configurations are stored in dedicated database tables (`BrandingSetting`, `SEOSetting`, `SMTPSetting`, `AnalyticsSetting`, `SecuritySetting`, `ShippingSetting`, `TaxSetting`, and `Setting`).

### Audit Logging & Security
Every modification to settings triggers an automated `ActivityLog` entry recording the executing `userId`, timestamp, affected configuration group, and serialized payload diff.

---

## 2. SETTINGS DOMAINS SPECIFICATION

### 2.1 BRANDING SETTINGS (`BrandingSetting`)
Controls merchant identity, storefront visual theme elements, logos, localization defaults, and regional formatting.

- **Admin Endpoints:**  
  - `GET /api/v1/settings/branding`  
  - `PUT /api/v1/settings/branding`  
- **Validation Schema:** `updateBrandingSettingsSchema`

| Field | Type | Validation / Constraints | Default Value | Description |
|-------|------|--------------------------|---------------|-------------|
| `siteName` | `string` | Optional string | `null` | Primary store name displayed in headers/footers |
| `siteTitle` | `string` | Optional string | `null` | Default HTML page `<title>` prefix/suffix |
| `siteTagline` | `string` | Optional string | `null` | Brand tagline for marketing headers |
| `logoUrl` | `string` | Optional URL string | `null` | Primary light mode logo image URL |
| `darkLogoUrl` | `string` | Optional URL string | `null` | Dark mode theme logo image URL |
| `faviconUrl` | `string` | Optional URL string | `null` | Store browser tab icon (.ico / .png) |
| `adminPanelName` | `string` | Optional string | `null` | Custom title for admin dashboard interface |
| `adminPanelLogo` | `string` | Optional URL string | `null` | Custom logo for admin login/dashboard sidebar |
| `invoiceLogo` | `string` | Optional URL string | `null` | High-res logo rendered on customer PDF invoices |
| `emailHeaderLogo` | `string` | Optional URL string | `null` | Logo embedded in transactional outbound emails |
| `primaryColor` | `string` | Optional HEX color (`#2563eb`) | `null` | Primary brand accent color |
| `footerText` | `string` | Optional HTML/string | `null` | Storefront footer copyright notice |
| `defaultLanguage` | `string` | Standard ISO language code | `"en"` | Primary language code (e.g. `en`, `bn`) |
| `defaultCurrency` | `string` | Standard ISO currency code | `"USD"` | Store settlement currency (e.g. `BDT`, `USD`) |
| `defaultTimezone` | `string` | IANA Timezone string | `"UTC"` | Timezone for reports & timelines (`Asia/Dhaka`) |

---

### 2.2 SEO SETTINGS (`SEOSetting`)
Configures global search engine optimization defaults, social media OpenGraph cards, search crawler index rules, and head injection scripts.

- **Admin Endpoints:**  
  - `GET /api/v1/settings/seo`  
  - `PUT /api/v1/settings/seo`  
- **Validation Schema:** `updateSEOSettingsSchema`

| Field | Type | Validation / Constraints | Default Value | Description |
|-------|------|--------------------------|---------------|-------------|
| `metaTitle` | `string` | Optional string | `null` | Global homepage meta title |
| `metaDescription` | `string` | Optional string | `null` | Global homepage search snippet description |
| `metaKeywords` | `string` | Optional comma-separated | `null` | Targeted global search keywords |
| `ogTitle` | `string` | Optional string | `null` | OpenGraph title for social media sharing |
| `ogDescription` | `string` | Optional string | `null` | OpenGraph snippet text |
| `ogImage` | `string` | Optional URL string | `null` | OpenGraph social banner thumbnail |
| `twitterTitle` | `string` | Optional string | `null` | Twitter card header title |
| `twitterDescription` | `string` | Optional string | `null` | Twitter card body text |
| `twitterImage` | `string` | Optional URL string | `null` | Twitter preview image card |
| `robotsTxt` | `string` | Multiline text | `null` | Content served at `/robots.txt` |
| `customHeadCode` | `string` | HTML/JS script block | `null` | Custom raw code injected inside `<head>` |

---

### 2.3 ANALYTICS SETTINGS (`AnalyticsSetting`)
Manages third-party tracking pixels, tag managers, and user behavior analytics.

- **Admin Endpoints:**  
  - `GET /api/v1/settings/analytics`  
  - `PUT /api/v1/settings/analytics`  
- **Validation Schema:** `updateAnalyticsSettingsSchema`

| Field | Type | Validation / Constraints | Default Value | Description |
|-------|------|--------------------------|---------------|-------------|
| `googleAnalyticsId` | `string` | GA4 Measurement ID (`G-XXXXXX`) | `null` | Google Analytics 4 tracking property |
| `googleTagManagerId` | `string` | GTM Container ID (`GTM-XXXXX`) | `null` | Google Tag Manager script ID |
| `facebookPixelId` | `string` | Meta Pixel ID string | `null` | Meta/Facebook Pixel pixel code |
| `hotjarId` | `string` | Hotjar Site ID | `null` | Hotjar heatmapping tracking code |
| `enableAnalytics` | `boolean` | `true` or `false` | `false` | Master toggle to enable/disable telemetry |

---

### 2.4 SMTP EMAIL SETTINGS (`SMTPSetting`)
Configures mail transport servers for sending system transactional emails (order receipts, password resets, shipping alerts).

- **Admin Endpoints:**  
  - `GET /api/v1/settings/smtp`  
  - `PUT /api/v1/settings/smtp`  
- **Validation Schema:** `updateSMTPSettingsSchema`

| Field | Type | Validation / Constraints | Default Value | Description |
|-------|------|--------------------------|---------------|-------------|
| `host` | `string` | Domain or IP address | `null` | Outbound mail server hostname |
| `port` | `integer` | Valid port (`25`, `465`, `587`) | `null` | Mail server network port |
| `username` | `string` | Optional string | `null` | SMTP authentication account username |
| `password` | `string` | Encrypted string | `null` | SMTP authentication account password |
| `fromEmail` | `string` | Valid email format | `null` | Sender address shown on customer emails |
| `fromName` | `string` | Optional string | `null` | Sender display name (e.g. "NexCommerce Support") |
| `secure` | `boolean` | `true` or `false` | `true` | Enforce TLS/SSL connection encryption |
| `enabled` | `boolean` | `true` or `false` | `false` | Enable outbound transactional email dispatch |

---

### 2.5 SECURITY SETTINGS (`SecuritySetting`)
Establishes system authentication governance, session timeout controls, rate limits, and site maintenance flags.

- **Admin Endpoints:**  
  - `GET /api/v1/settings/security`  
  - `PUT /api/v1/settings/security`  
- **Validation Schema:** `updateSecuritySettingsSchema`

| Field | Type | Validation / Constraints | Default Value | Description |
|-------|------|--------------------------|---------------|-------------|
| `enable2FA` | `boolean` | `true` or `false` | `false` | Mandate Two-Factor Authentication for staff |
| `passwordMinLength` | `integer` | Minimum: `1` (recommended >= 8) | `8` | Password strength enforcement threshold |
| `sessionTimeoutMinutes` | `integer` | Minimum: `1` | `60` | Auto-logout duration for inactive admin sessions |
| `maxLoginAttempts` | `integer` | Minimum: `1` | `5` | Failed attempts prior to IP/account lockout |
| `enableMaintenanceMode` | `boolean` | `true` or `false` | `false` | Redirect storefront to maintenance notice |
| `maintenanceMessage` | `string` | Custom notification text | `null` | Message displayed during site maintenance |

---

### 2.6 SHIPPING SETTINGS (`ShippingSetting`)
Defines fallback shipping fees and free shipping eligibility thresholds.

- **Admin Endpoints:**  
  - `GET /api/v1/settings/shipping`  
  - `PUT /api/v1/settings/shipping`  
- **Validation Schema:** `updateShippingSettingsSchema`

| Field | Type | Validation / Constraints | Default Value | Description |
|-------|------|--------------------------|---------------|-------------|
| `defaultShippingCost` | `number` | Minimum: `0` | `0` | Base delivery fee applied at checkout |
| `freeShippingThreshold` | `number` | Minimum: `0` | `null` | Subtotal amount required to waive shipping fee |
| `enableFreeShipping` | `boolean` | `true` or `false` | `false` | Master switch for free shipping rule engine |

---

### 2.7 TAX SETTINGS (`TaxSetting`)
Configures default tax rates and tax calculation models.

- **Admin Endpoints:**  
  - `GET /api/v1/settings/tax`  
  - `PUT /api/v1/settings/tax`  
- **Validation Schema:** `updateTaxSettingsSchema`

| Field | Type | Validation / Constraints | Default Value | Description |
|-------|------|--------------------------|---------------|-------------|
| `defaultTaxRate` | `number` | Percentage (e.g. `15.0` for 15%) | `0` | Default VAT/Sales tax rate |
| `pricesIncludeTax` | `boolean` | `true` or `false` | `false` | True if product prices are tax-inclusive |

---

## 3. PUBLIC STOREFRONT SETTINGS API (`GET /settings/public`)

To safeguard sensitive backend configurations (such as SMTP credentials, password policies, and security limits), the public storefront endpoint exposes a sanitized subset of branding, SEO, and analytics configurations needed for client rendering and tracking scripts.

- **Method:** `GET`
- **URL:** `/api/storefront/v1/settings/public`
- **Authentication:** None (Public)
- **Caching Strategy:** Highly cacheable at CDN/Edge layer

### Response Schema Specification
```json
{
  "status": "success",
  "data": {
    "branding": {
      "siteName": "string | null",
      "siteTitle": "string | null",
      "siteTagline": "string | null",
      "logoUrl": "string | null",
      "faviconUrl": "string | null",
      "adminPanelName": "string | null",
      "adminPanelLogo": "string | null",
      "primaryColor": "string | null",
      "footerText": "string | null",
      "defaultLanguage": "string",
      "defaultCurrency": "string",
      "defaultTimezone": "string"
    },
    "seo": {
      "metaTitle": "string | null",
      "metaDescription": "string | null",
      "metaKeywords": "string | null",
      "ogTitle": "string | null",
      "ogDescription": "string | null",
      "ogImage": "string | null",
      "twitterTitle": "string | null",
      "twitterDescription": "string | null",
      "twitterImage": "string | null",
      "customHeadCode": "string | null"
    },
    "analytics": {
      "googleAnalyticsId": "string | null",
      "googleTagManagerId": "string | null",
      "facebookPixelId": "string | null",
      "hotjarId": "string | null",
      "enableAnalytics": "boolean"
    }
  }
}
```

### Complete JSON Response Example
```json
{
  "status": "success",
  "data": {
    "branding": {
      "siteName": "NexCommerce Store",
      "siteTitle": "NexCommerce - Next-Gen E-Commerce",
      "siteTagline": "Premium Quality Gear & Electronics",
      "logoUrl": "https://res.cloudinary.com/demo/image/upload/v1/logo.png",
      "faviconUrl": "https://res.cloudinary.com/demo/image/upload/v1/favicon.ico",
      "adminPanelName": "NexCommerce Admin",
      "adminPanelLogo": "https://res.cloudinary.com/demo/image/upload/v1/admin-logo.png",
      "primaryColor": "#2563eb",
      "footerText": "© 2026 NexCommerce Inc. All rights reserved.",
      "defaultLanguage": "en",
      "defaultCurrency": "BDT",
      "defaultTimezone": "Asia/Dhaka"
    },
    "seo": {
      "metaTitle": "NexCommerce Online Store",
      "metaDescription": "Shop top electronic products with quick shipping.",
      "metaKeywords": "electronics, gadgets, audio, ecommerce",
      "ogTitle": "NexCommerce Online Store",
      "ogDescription": "Shop top electronic products with quick shipping.",
      "ogImage": "https://res.cloudinary.com/demo/image/upload/v1/og-banner.jpg",
      "twitterTitle": "NexCommerce Online Store",
      "twitterDescription": "Shop top electronic products with quick shipping.",
      "twitterImage": "https://res.cloudinary.com/demo/image/upload/v1/twitter-banner.jpg",
      "customHeadCode": "<meta name=\"author\" content=\"NexCommerce\">"
    },
    "analytics": {
      "googleAnalyticsId": "G-1234567890",
      "googleTagManagerId": "GTM-ABCDEF",
      "facebookPixelId": "9876543210",
      "hotjarId": "112233",
      "enableAnalytics": true
    }
  }
}
```

---

*End of Store Configuration & Settings Module Reference.*
