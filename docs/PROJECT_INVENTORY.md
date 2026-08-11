# PHYSICAL PROJECT INVENTORY DOCUMENT

**Audit Timestamp:** 2026-08-10T18:15:21-07:00  
**Environment:** Full-Stack Enterprise E-Commerce System (Node.js / Express / TypeScript / Prisma / PostgreSQL / React / Vite / Tailwind)

---

## 1. COMPLETE FOLDER STRUCTURE

```
/app/applet/
├── .env
├── .env.example
├── .gitignore
├── ARCHITECTURE.md
├── check_schema.cjs
├── docs/
│   ├── PROJECT_INVENTORY.md
│   ├── SYSTEM_HEALTH_AUDIT.md
│   └── TECHNICAL_SPECIFICATIONS.md
├── index.html
├── metadata.json
├── package.json
├── package-lock.json
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── README.md
├── README_ADMIN_INTEGRATION_AUDIT.md
├── README_BACKEND_API_AUDIT.md
├── README_CLOUDINARY_AUDIT.md
├── README_CLOUDINARY_PRODUCTION_AUDIT.md
├── README_DATABASE_SCALABILITY_AUDIT.md
├── README_FINAL_SCORECARD.md
├── README_FINANCIAL_AUDIT.md
├── README_PERFORMANCE_AUDIT.md
├── README_PHASE1_AUDIT.md
├── README_POSTGRESQL_AUDIT.md
├── README_POSTGRESQL_HARDENING_AUDIT.md
├── README_PRISMA_AUDIT.md
├── README_PRISMA_PERFORMANCE_AUDIT.md
├── README_PRODUCT_MEDIA.md
├── README_RBAC_AUDIT.md
├── README_STOREFRONT_API_AUDIT.md
├── server.ts
├── src/
│   ├── App.tsx
│   ├── backend/
│   │   ├── config/
│   │   │   ├── cloudinary.ts
│   │   │   ├── db.ts
│   │   │   ├── env.ts
│   │   │   ├── logger.ts
│   │   │   └── swagger.ts
│   │   ├── controllers/
│   │   │   ├── analytics.controller.ts
│   │   │   ├── attribute-value.controller.ts
│   │   │   ├── attribute.controller.ts
│   │   │   ├── audit.controller.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── banner.controller.ts
│   │   │   ├── blog.controller.ts
│   │   │   ├── brand.controller.ts
│   │   │   ├── category.controller.ts
│   │   │   ├── coupon.controller.ts
│   │   │   ├── customer.controller.ts
│   │   │   ├── faq.controller.ts
│   │   │   ├── inventory.controller.ts
│   │   │   ├── landing-page.controller.ts
│   │   │   ├── marketing.controller.ts
│   │   │   ├── media.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   ├── order.controller.ts
│   │   │   ├── page.controller.ts
│   │   │   ├── payment.controller.ts
│   │   │   ├── permission.controller.ts
│   │   │   ├── popup.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   ├── promotion.controller.ts
│   │   │   ├── refund.controller.ts
│   │   │   ├── return.controller.ts
│   │   │   ├── role.controller.ts
│   │   │   ├── seo.controller.ts
│   │   │   ├── session.controller.ts
│   │   │   ├── setting.controller.ts
│   │   │   ├── shipment.controller.ts
│   │   │   ├── storefront/
│   │   │   │   ├── account.controller.ts
│   │   │   │   ├── activity.controller.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── blog.controller.ts
│   │   │   │   ├── brand.controller.ts
│   │   │   │   ├── cart.controller.ts
│   │   │   │   ├── category.controller.ts
│   │   │   │   ├── checkout.controller.ts
│   │   │   │   ├── faq.controller.ts
│   │   │   │   ├── landing-page.controller.ts
│   │   │   │   ├── merchant.controller.ts
│   │   │   │   ├── notification.controller.ts
│   │   │   │   ├── order.controller.ts
│   │   │   │   ├── page.controller.ts
│   │   │   │   ├── payment.controller.ts
│   │   │   │   ├── product.controller.ts
│   │   │   │   ├── refund.controller.ts
│   │   │   │   ├── return.controller.ts
│   │   │   │   ├── search.controller.ts
│   │   │   │   ├── seo.controller.ts
│   │   │   │   ├── setting.controller.ts
│   │   │   │   └── wishlist.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── variant.controller.ts
│   │   ├── dtos/
│   │   │   └── storefront/
│   │   │       ├── mappers.ts
│   │   │       ├── search.dto.ts
│   │   │       ├── seo.dto.ts
│   │   │       └── types.ts
│   │   ├── middlewares/
│   │   │   ├── auth.ts
│   │   │   ├── customerAuth.ts
│   │   │   ├── errorHandler.ts
│   │   │   ├── rateLimiter.ts
│   │   │   ├── storefront/
│   │   │   │   ├── logging.middleware.ts
│   │   │   │   └── validation.middleware.ts
│   │   │   └── validation.ts
│   │   ├── routes/
│   │   │   ├── analytics.routes.ts
│   │   │   ├── attribute-value.routes.ts
│   │   │   ├── attribute.routes.ts
│   │   │   ├── audit.routes.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── banner.routes.ts
│   │   │   ├── blog.routes.ts
│   │   │   ├── brand.routes.ts
│   │   │   ├── category.routes.ts
│   │   │   ├── coupon.routes.ts
│   │   │   ├── customer.routes.ts
│   │   │   ├── faq.routes.ts
│   │   │   ├── inventory.routes.ts
│   │   │   ├── landing-page.routes.ts
│   │   │   ├── marketing.routes.ts
│   │   │   ├── media.routes.ts
│   │   │   ├── notification.routes.ts
│   │   │   ├── order.routes.ts
│   │   │   ├── page.routes.ts
│   │   │   ├── payment.routes.ts
│   │   │   ├── permission.routes.ts
│   │   │   ├── popup.routes.ts
│   │   │   ├── product.routes.ts
│   │   │   ├── promotion.routes.ts
│   │   │   ├── refund.routes.ts
│   │   │   ├── return.routes.ts
│   │   │   ├── role.routes.ts
│   │   │   ├── seo.routes.ts
│   │   │   ├── session.routes.ts
│   │   │   ├── setting.routes.ts
│   │   │   ├── shipment.routes.ts
│   │   │   ├── storefront/
│   │   │   │   ├── account.routes.ts
│   │   │   │   ├── activity.routes.ts
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── blog.routes.ts
│   │   │   │   ├── brand.routes.ts
│   │   │   │   ├── cart.routes.ts
│   │   │   │   ├── category.routes.ts
│   │   │   │   ├── checkout.routes.ts
│   │   │   │   ├── faq.routes.ts
│   │   │   │   ├── landing-page.routes.ts
│   │   │   │   ├── merchant.routes.ts
│   │   │   │   ├── notification.routes.ts
│   │   │   │   ├── order.routes.ts
│   │   │   │   ├── page.routes.ts
│   │   │   │   ├── payment.routes.ts
│   │   │   │   ├── product.routes.ts
│   │   │   │   ├── refund.routes.ts
│   │   │   │   ├── return.routes.ts
│   │   │   │   ├── search.routes.ts
│   │   │   │   ├── seo.routes.ts
│   │   │   │   ├── setting.routes.ts
│   │   │   │   └── wishlist.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   └── variant.routes.ts
│   │   ├── services/
│   │   │   ├── abandoned_cart.service.ts
│   │   │   ├── analytics.service.ts
│   │   │   ├── audit.service.ts
│   │   │   ├── event.service.ts
│   │   │   ├── ga4.service.ts
│   │   │   ├── media.service.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── payment.service.ts
│   │   │   ├── product-media.service.ts
│   │   │   ├── refund.service.ts
│   │   │   ├── return.service.ts
│   │   │   ├── setting.service.ts
│   │   │   ├── shipment.service.ts
│   │   │   └── storefront/
│   │   │       ├── account.service.ts
│   │   │       ├── activity.service.ts
│   │   │       ├── auth.service.ts
│   │   │       ├── brand.service.ts
│   │   │       ├── cart.service.ts
│   │   │       ├── category.service.ts
│   │   │       ├── checkout.service.ts
│   │   │       ├── content.service.ts
│   │   │       ├── ga4.service.ts
│   │   │       ├── merchant.service.ts
│   │   │       ├── notification.service.ts
│   │   │       ├── order.service.ts
│   │   │       ├── payment.service.ts
│   │   │       ├── product.service.ts
│   │   │       ├── refund.service.ts
│   │   │       ├── return.service.ts
│   │   │       ├── search.service.ts
│   │   │       ├── seo.service.ts
│   │   │       ├── setting.service.ts
│   │   │       └── wishlist.service.ts
│   │   ├── utils/
│   │   │   ├── activityLog.ts
│   │   │   ├── AppError.ts
│   │   │   ├── asyncHandler.ts
│   │   │   └── customerJwt.ts
│   │   └── validators/
│   │       ├── account.validator.ts
│   │       ├── cart.validator.ts
│   │       ├── checkout.validator.ts
│   │       ├── notification.validator.ts
│   │       ├── payment.validator.ts
│   │       ├── refund.validator.ts
│   │       ├── return.validator.ts
│   │       ├── setting.validator.ts
│   │       ├── shipment.validator.ts
│   │       ├── storefront-auth.validator.ts
│   │       └── wishlist.validator.ts
│   ├── components/
│   │   ├── admin/
│   │   │   └── MediaUploaderInput.tsx
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── PermissionGuard.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── products/
│   │   │   └── ProductMediaTab.tsx
│   │   └── ui/
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── table.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── BrandingContext.tsx
│   ├── hooks/
│   │   └── useGA4.ts
│   ├── index.css
│   ├── lib/
│   │   ├── api.ts
│   │   ├── ga4.ts
│   │   ├── ga4-ecommerce.ts
│   │   ├── media-storage.ts
│   │   └── utils.ts
│   ├── main.tsx
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── banners/
│   │   │   │   └── BannersList.tsx
│   │   │   ├── blog/
│   │   │   │   ├── BlogManagement.tsx
│   │   │   │   ├── BlogPostCreate.tsx
│   │   │   │   ├── BlogPostEdit.tsx
│   │   │   │   └── BlogPostForm.tsx
│   │   │   ├── cms/
│   │   │   │   ├── CmsPageCreate.tsx
│   │   │   │   ├── CmsPageEdit.tsx
│   │   │   │   ├── CmsPageForm.tsx
│   │   │   │   └── CmsPagesList.tsx
│   │   │   ├── coupons/
│   │   │   │   └── CouponsList.tsx
│   │   │   ├── customers/
│   │   │   │   ├── CustomerDetail.tsx
│   │   │   │   └── CustomersList.tsx
│   │   │   ├── faqs/
│   │   │   │   └── FaqManagement.tsx
│   │   │   ├── landing-pages/
│   │   │   │   └── LandingPagesList.tsx
│   │   │   ├── marketing/
│   │   │   │   └── MarketingList.tsx
│   │   │   ├── media/
│   │   │   │   └── MediaLibrary.tsx
│   │   │   ├── notifications/
│   │   │   │   └── NotificationsList.tsx
│   │   │   ├── orders/
│   │   │   │   ├── OrderDetail.tsx
│   │   │   │   └── OrdersList.tsx
│   │   │   ├── payments/
│   │   │   │   ├── PaymentDetails.tsx
│   │   │   │   └── PaymentsList.tsx
│   │   │   ├── popups/
│   │   │   │   └── PopupsList.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── promotions/
│   │   │   │   └── PromotionsList.tsx
│   │   │   ├── refunds/
│   │   │   │   ├── RefundDetails.tsx
│   │   │   │   └── RefundsList.tsx
│   │   │   ├── returns/
│   │   │   │   ├── ReturnDetails.tsx
│   │   │   │   └── ReturnsList.tsx
│   │   │   ├── RolePermissions.tsx
│   │   │   ├── Roles.tsx
│   │   │   ├── seo/
│   │   │   │   └── SeoManagement.tsx
│   │   │   ├── Sessions.tsx
│   │   │   ├── settings/
│   │   │   │   └── Settings.tsx
│   │   │   ├── shipments/
│   │   │   │   ├── ShipmentDetails.tsx
│   │   │   │   └── ShipmentsList.tsx
│   │   │   └── Users.tsx
│   │   ├── Analytics.tsx
│   │   ├── AuditLogs.tsx
│   │   ├── auth/
│   │   │   ├── ForgotPassword.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── ResetPassword.tsx
│   │   ├── brands/
│   │   │   ├── BrandCreate.tsx
│   │   │   ├── BrandEdit.tsx
│   │   │   ├── BrandForm.tsx
│   │   │   └── BrandList.tsx
│   │   ├── categories/
│   │   │   ├── CategoryCreate.tsx
│   │   │   ├── CategoryEdit.tsx
│   │   │   ├── CategoryForm.tsx
│   │   │   └── CategoryList.tsx
│   │   ├── Dashboard.tsx
│   │   ├── GA4Example.tsx
│   │   ├── Inventory.tsx
│   │   ├── PlaceholderPage.tsx
│   │   ├── products/
│   │   │   ├── ProductCreate.tsx
│   │   │   ├── ProductEdit.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── ProductVariants.tsx
│   │   │   └── ProductView.tsx
│   │   └── Products.tsx
│   └── utils/
│       └── analytics.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 2. BACKEND MODULES

1. **Authentication & Identity (`auth`, `session`, `customerAuth`)**
   - Admin JWT authentication, session tracking, password hashing, customer JWT token handling.
2. **Product Catalog Engine (`product`, `variant`, `category`, `brand`, `attribute`, `attribute-value`, `product-media`)**
   - Managing products, variants, image assets, attributes, brands, categories, and tags.
3. **Inventory Control (`inventory`)**
   - Multi-warehouse stock tracking, threshold monitoring, low/out-of-stock reporting, and inventory value calculation.
4. **Order & Checkout Processing (`order`, `checkout`, `cart`)**
   - Cart management, coupon validation, atomic checkout sessions, timeline logging, order fulfillment.
5. **Financial & Payment Processing (`payment`, `refund`)**
   - Payment status transitions, transaction history, refund requests, partial/full refunds, timeline audit trails.
6. **Logistics & Returns (`shipment`, `return`, `courier`)**
   - Dispatch tracking, tracking events, return requests, receiving returned goods, auto-restocking inventory.
7. **Customer Relationship Management (`customer`, `account`, `wishlist`)**
   - Customer profiles, address book, saved wishlists, customer activity feeds, notes.
8. **CMS & Content Engine (`blog`, `page`, `landing-page`, `faq`, `seo`, `banner`, `popup`, `coupon`, `promotion`, `marketing`)**
   - Static/dynamic CMS pages, blog publishing, FAQs, homepage banners, promotional popups, coupons, and discounts.
9. **Media & Storage Service (`media`, `cloudinary`)**
   - Cloudinary image asset uploads, folder structuring, asset deletion, media library metadata sync.
10. **System Governance & Audit (`setting`, `audit`, `analytics`, `notification`)**
    - Store configuration settings (Branding, SEO, Security, Tax, Shipping, SMTP), activity audit logging, GA4 event tracking, in-app notifications.

---

## 3. ADMIN MODULES

1. **Executive Dashboard & Analytics**
   - `Dashboard.tsx`: Executive Overview KPI widgets, revenue trends, quick activity streams.
   - `Analytics.tsx`: Deep analytics charts, sales reporting, product performance metrics.
   - `GA4Example.tsx`: Google Analytics 4 integration testing interface.
   - `AuditLogs.tsx`: System audit trail viewer with user filtering.

2. **Catalog & Inventory Administration**
   - `Products.tsx`, `ProductForm.tsx`, `ProductView.tsx`, `ProductEdit.tsx`, `ProductCreate.tsx`, `ProductVariants.tsx`
   - `Inventory.tsx`: Real-time warehouse inventory table with stock adjustment controls.
   - `BrandList.tsx`, `BrandCreate.tsx`, `BrandEdit.tsx`, `BrandForm.tsx`
   - `CategoryList.tsx`, `CategoryCreate.tsx`, `CategoryEdit.tsx`, `CategoryForm.tsx`

3. **Order & Customer Operations**
   - `OrdersList.tsx`: Order management table with status filtering.
   - `OrderDetail.tsx`: Order detail view, status updates, staff assignment, internal notes.
   - `CustomersList.tsx`: Customer directory with lifetime value & total order calculations.
   - `CustomerDetail.tsx`: Individual customer profiles, order history, activity timeline.

4. **Financial, Refund & Shipment Management**
   - `PaymentsList.tsx`, `PaymentDetails.tsx`: Payment ledger, transaction lookup, status overrides.
   - `RefundsList.tsx`, `RefundDetails.tsx`: Refund requests, approval workflows, payment balance verification.
   - `ReturnsList.tsx`, `ReturnDetails.tsx`: Return requests, approval, receiving & inventory restock triggers.
   - `ShipmentsList.tsx`, `ShipmentDetails.tsx`: Dispatch creation, courier assignment, tracking timeline.

5. **Marketing, Promotions & CMS Administration**
   - `BannersList.tsx`: Promotional banner banner management.
   - `BlogManagement.tsx`, `BlogPostCreate.tsx`, `BlogPostEdit.tsx`, `BlogPostForm.tsx`: Blog post publisher.
   - `CmsPagesList.tsx`, `CmsPageCreate.tsx`, `CmsPageEdit.tsx`, `CmsPageForm.tsx`: Custom page builder.
   - `CouponsList.tsx`: Coupon code creator with minimum spend & usage limit rules.
   - `FaqManagement.tsx`: FAQ category and question/answer editor.
   - `LandingPagesList.tsx`: Marketing landing pages manager.
   - `MarketingList.tsx`: Campaign scheduler and ROI tracker.
   - `PopupsList.tsx`: On-site modal/popup popup builder.
   - `PromotionsList.tsx`: Discount promotion engine.
   - `SeoManagement.tsx`: Global SEO metadata & OpenGraph config.

6. **System Administration & Security**
   - `MediaLibrary.tsx`: Central Cloudinary media file manager with uploader integration.
   - `NotificationsList.tsx`: Admin system notifications list.
   - `Profile.tsx`: User profile and password management.
   - `Roles.tsx`, `RolePermissions.tsx`: RBAC role editor and permission matrix grid.
   - `Users.tsx`: Admin user management table.
   - `Sessions.tsx`: Active user token sessions manager.
   - `Settings.tsx`: Storefront configuration settings tabbed view (Branding, SEO, Security, Shipping, Tax, SMTP).

---

## 4. PRISMA MODELS (75 Models)

Defined physically in `prisma/schema.prisma`:

1. `User`: Admin staff user accounts.
2. `RefreshToken`: Admin auth tokens.
3. `Role`: RBAC role definition.
4. `Permission`: Granular module action permissions.
5. `Customer`: Storefront buyer account.
6. `CustomerNote`: Internal admin notes on customers.
7. `Vendor`: Product suppliers.
8. `Warehouse`: Fulfillment inventory center.
9. `Category`: Hierarchical catalog taxonomy.
10. `CategoryImage`: Media links for categories.
11. `Brand`: Product brand metadata.
12. `BrandImage`: Media links for brands.
13. `Tag`: General catalog tag.
14. `ProductTag`: Relation mapping between Product and Tag.
15. `Attribute`: Variant dimensions (Color, Size).
16. `AttributeValue`: Values for attributes (Red, Large).
17. `Product`: Core catalog item.
18. `ProductVariant`: SKU-level product variation.
19. `VariantAttributeValue`: Relation mapping variant values.
20. `ProductImage`: Product gallery image record.
21. `Inventory`: Warehouse stock level record.
22. `Order`: Customer purchase order.
23. `OrderItem`: Line item inside an order.
24. `OrderTimeline`: Order status audit trail event.
25. `OrderNote`: Internal order comments.
26. `Coupon`: Discount code definition.
27. `Promotion`: Catalog promotion rule.
28. `MarketingCampaign`: Strategic marketing campaign.
29. `Banner`: Dynamic storefront banner.
30. `Popup`: Promotional storefront popup modal.
31. `Review`: Customer product review.
32. `ActivityLog`: Admin security audit log.
33. `Page`: Static CMS page.
34. `PageVersion`: Historical revision of CMS pages.
35. `LandingPage`: Specialized marketing landing page.
36. `BlogPost`: Editorial blog post.
37. `BlogCategory`: Taxonomy for blog posts.
38. `BlogTag`: Tags for blog posts.
39. `SeoMetadata`: SEO tags entity attachment.
40. `GlobalSeoSettings`: Site-wide default SEO settings.
41. `MediaAsset`: Uploaded media file metadata.
42. `FAQCategory`: Categorization for FAQ entries.
43. `FAQ`: Customer question and answer item.
44. `CustomerAddress`: Saved shipping/billing address.
45. `CustomerRefreshToken`: Storefront auth session token.
46. `Wishlist`: Customer saved items list.
47. `WishlistItem`: Individual item in wishlist.
48. `Cart`: Active shopping cart session.
49. `CartItem`: Line item inside shopping cart.
50. `Payment`: Payment record tied to an order.
51. `PaymentTransaction`: Raw provider transaction payload log.
52. `PaymentWebhookLog`: Received webhook event log.
53. `Refund`: Refund record tied to payment/order.
54. `RefundTransaction`: Refund gateway audit log.
55. `Courier`: Shipping provider account.
56. `Shipment`: Fulfillment package dispatch record.
57. `ShipmentItem`: Individual item inside a shipment.
58. `TrackingEvent`: Courier tracking update event.
59. `ReturnRequest`: Customer return request application.
60. `ReturnItem`: Individual item inside a return request.
61. `Notification`: Customer in-app notification.
62. `NotificationPreference`: Customer notification settings.
63. `CustomerActivity`: Customer behavior audit event.
64. `AnalyticsEvent`: GA4/telemetry analytics event.
65. `AbandonedCart`: Detected inactive cart session.
66. `Setting`: Generic key-value store setting.
67. `BrandingSetting`: Storefront logo, palette, and styling config.
68. `SEOSetting`: Search engine optimization store config.
69. `SMTPSetting`: Outgoing email server credentials config.
70. `AnalyticsSetting`: GA4 measurement ID config.
71. `SecuritySetting`: Password and session security policies.
72. `ShippingSetting`: Flat shipping rates and threshold config.
73. `TaxSetting`: Default tax rate and calculation rules.

---

## 5. ROUTE INVENTORY

### Admin API Routes (`/api/v1/*`)
- `/api/v1/auth`: `POST /login`, `POST /logout`, `GET /me`, `POST /refresh-token`
- `/api/v1/users`: `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`
- `/api/v1/roles`: `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`
- `/api/v1/permissions`: `GET /`
- `/api/v1/sessions`: `GET /`, `DELETE /:id`
- `/api/v1/products`: `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`
- `/api/v1/variants`: `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`
- `/api/v1/categories`: `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`
- `/api/v1/brands`: `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`
- `/api/v1/attributes`: `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`
- `/api/v1/attribute-values`: `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`
- `/api/v1/inventory`: `GET /`, `GET /low-stock`, `GET /out-of-stock`, `GET /value`, `PUT /:id`
- `/api/v1/orders`: `GET /`, `GET /:id`, `PUT /:id/status`, `PATCH /:id/assign`, `POST /:id/notes`, `DELETE /:id`
- `/api/v1/customers`: `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id`
- `/api/v1/payments`: `GET /`, `GET /:id`, `PUT /:id/status`
- `/api/v1/refunds`: `GET /`, `GET /:id`, `POST /`, `PUT /:id/process`
- `/api/v1/shipments`: `GET /`, `GET /:id`, `POST /`, `PUT /:id/status`
- `/api/v1/returns`: `GET /`, `GET /:id`, `PUT /:id/approve`, `PUT /:id/reject`, `PUT /:id/receive`
- `/api/v1/coupons`: `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`
- `/api/v1/promotions`: `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`
- `/api/v1/marketing`: `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`
- `/api/v1/banners`: `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`
- `/api/v1/popups`: `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`
- `/api/v1/blog`: `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`
- `/api/v1/pages`: `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`
- `/api/v1/landing-pages`: `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`
- `/api/v1/faqs`: `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`
- `/api/v1/media`: `GET /`, `POST /upload`, `DELETE /:id`
- `/api/v1/settings`: `GET /`, `PUT /`
- `/api/v1/audit-logs`: `GET /`
- `/api/v1/analytics`: `GET /overview`, `GET /sales`
- `/api/v1/notifications`: `GET /`, `PUT /:id/read`

### Storefront API Routes (`/api/v1/storefront/*`)
- `/auth`: `POST /register`, `POST /login`, `GET /me`, `POST /logout`
- `/products`: `GET /`, `GET /:slug`
- `/categories`: `GET /`, `GET /:slug`
- `/brands`: `GET /`, `GET /:slug`
- `/cart`: `GET /`, `POST /items`, `PUT /items/:id`, `DELETE /items/:id`
- `/checkout`: `GET /session`, `POST /apply-coupon`, `POST /addresses`, `POST /complete`
- `/orders`: `GET /`, `GET /:id`
- `/account`: `GET /profile`, `PUT /profile`, `GET /addresses`, `POST /addresses`, `PUT /addresses/:id`, `DELETE /addresses/:id`
- `/wishlist`: `GET /`, `POST /items`, `DELETE /items/:id`
- `/search`: `GET /`
- `/seo`: `GET /global`, `GET /entity`
- `/merchant`: `GET /info`
- `/content/blog`: `GET /`, `GET /:slug`
- `/content/pages`: `GET /`, `GET /:slug`
- `/content/faqs`: `GET /`
- `/notifications`: `GET /`, `PUT /:id/read`
- `/payments`: `POST /initiate`
- `/refunds`: `POST /request`
- `/returns`: `POST /request`

---

## 6. CONTROLLERS INVENTORY

### Admin Controllers (`src/backend/controllers/`)
- `analytics.controller.ts`: Dashboard sales analytics & reports.
- `attribute-value.controller.ts`: Attribute option value CRUD.
- `attribute.controller.ts`: Variant attribute dimension CRUD.
- `audit.controller.ts`: System activity audit logs query.
- `auth.controller.ts`: Admin login, logout, profile token handlers.
- `banner.controller.ts`: Storefront banner CRUD.
- `blog.controller.ts`: Editorial blog post CRUD.
- `brand.controller.ts`: Brand catalog metadata CRUD.
- `category.controller.ts`: Hierarchical category taxonomy CRUD.
- `coupon.controller.ts`: Promotional coupon code CRUD.
- `customer.controller.ts`: Customer directory, details, & lifetime value calculation.
- `faq.controller.ts`: FAQ questions & categories CRUD.
- `inventory.controller.ts`: Warehouse stock query & inventory valuation.
- `landing-page.controller.ts`: Custom landing page CMS controller.
- `marketing.controller.ts`: Marketing campaign management.
- `media.controller.ts`: Media library asset uploads and removal.
- `notification.controller.ts`: System notifications broadcast controller.
- `order.controller.ts`: Admin order list, status updates, notes, & staff assignments.
- `page.controller.ts`: Static CMS pages manager.
- `payment.controller.ts`: Payment ledger list & manual status overrides.
- `permission.controller.ts`: Permission matrix list.
- `popup.controller.ts`: Storefront modal popups CRUD.
- `product.controller.ts`: Catalog product CRUD with bulk creation optimization & pagination.
- `promotion.controller.ts`: Promotion rule CRUD.
- `refund.controller.ts`: Admin refund approval and initiation controller.
- `return.controller.ts`: Admin return approval, rejection, and receiving restock controller.
- `role.controller.ts`: RBAC role management.
- `seo.controller.ts`: Global SEO metadata configuration.
- `session.controller.ts`: Active admin sessions viewer.
- `setting.controller.ts`: Global system setting manager.
- `shipment.controller.ts`: Dispatch shipment creation and status update controller.
- `user.controller.ts`: Admin staff user account manager.
- `variant.controller.ts`: Product SKU variant manager.

### Storefront Controllers (`src/backend/controllers/storefront/`)
- `account.controller.ts`: Customer account profile and address book.
- `activity.controller.ts`: Customer behavior tracking logging.
- `auth.controller.ts`: Storefront user registration and authentication.
- `blog.controller.ts`: Public blog post viewer.
- `brand.controller.ts`: Public brand catalog listing.
- `cart.controller.ts`: Cart item addition, quantity updates, and deletion.
- `category.controller.ts`: Public category catalog listing.
- `checkout.controller.ts`: Checkout session assembly, coupon application, address selection, atomic placement.
- `faq.controller.ts`: Public FAQ viewer.
- `landing-page.controller.ts`: Public landing page viewer.
- `merchant.controller.ts`: Merchant profile info.
- `notification.controller.ts`: Customer in-app notifications.
- `order.controller.ts`: Customer order history and detail lookup.
- `page.controller.ts`: Public static CMS page viewer.
- `payment.controller.ts`: Customer payment checkout entry.
- `product.controller.ts`: Public catalog search, filter, and detail view.
- `refund.controller.ts`: Customer refund request submission.
- `return.controller.ts`: Customer return request submission.
- `search.controller.ts`: Full-text product search and faceted filtering.
- `seo.controller.ts`: Storefront SEO metadata provider.
- `setting.controller.ts`: Storefront branding & settings fetcher.
- `wishlist.controller.ts`: Customer wishlist management.

---

## 7. SERVICES INVENTORY

### Core Backend Services (`src/backend/services/`)
- `abandoned_cart.service.ts`: Detects abandoned shopping carts (>24h inactive) and creates records.
- `analytics.service.ts`: Aggregates revenue, order volume, and sales trends.
- `audit.service.ts`: Creates security audit logs for admin actions.
- `event.service.ts`: Dispatches system events.
- `ga4.service.ts`: Formats and forwards events to Google Analytics 4.
- `media.service.ts`: Cloudinary SDK integration, direct file streams, signature generation.
- `notification.service.ts`: Generates and delivers notifications.
- `payment.service.ts`: Admin payment processing & status updates inside transactions.
- `product-media.service.ts`: Manages gallery images, primary image assignments, and reordering.
- `refund.service.ts`: Atomic refund processing with TOCTOU concurrency guards and payment balance verification.
- `return.service.ts`: Atomic return approval and inventory restocking (`quantityAvailable`).
- `setting.service.ts`: Handles database system configuration read/write operations.
- `shipment.service.ts`: Generates shipments and tracking events.

### Storefront Services (`src/backend/services/storefront/`)
- `account.service.ts`: Manages customer addresses and profile updates.
- `activity.service.ts`: Records storefront customer activity logs.
- `auth.service.ts`: Customer password verification and JWT issuance.
- `brand.service.ts`: Serves active catalog brands.
- `cart.service.ts`: Manages cart persistence and item calculations.
- `category.service.ts`: Serves active category trees.
- `checkout.service.ts`: Validates stock levels, coupon usage, shipping/taxes, and performs atomic checkouts.
- `content.service.ts`: Serves pages, blogs, and FAQs for public display.
- `ga4.service.ts`: Maps storefront customer behavior to GA4 e-commerce schemas.
- `merchant.service.ts`: Provides public business info.
- `notification.service.ts`: Customer notification list manager.
- `order.service.ts`: Fetches customer order history and item details.
- `payment.service.ts`: Initiates payment gateway checkouts.
- `product.service.ts`: Retrieves catalog products and handles variant options.
- `refund.service.ts`: Validates and submits customer refund requests.
- `return.service.ts`: Validates order eligibility and submits return requests.
- `search.service.ts`: Executes search queries with price/attribute facets.
- `seo.service.ts`: Builds site OpenGraph and SEO metadata payloads.
- `setting.service.ts`: Returns public storefront branding parameters.
- `wishlist.service.ts`: Manages saved product wishlists.

---

## 8. DTO INVENTORY

Located in `src/backend/dtos/storefront/`:

1. `types.ts`:
   - `StorefrontProductDTO`
   - `StorefrontCategoryDTO`
   - `StorefrontBrandDTO`
   - `StorefrontVariantDTO`
   - `StorefrontOrderDTO`
   - `StorefrontCartDTO`
   - `StorefrontCheckoutSessionDTO`
2. `mappers.ts`:
   - `mapProductToStorefrontDTO`
   - `mapCategoryToStorefrontDTO`
   - `mapBrandToStorefrontDTO`
   - `mapVariantToStorefrontDTO`
   - `mapOrderToStorefrontDTO`
   - `mapCartToStorefrontDTO`
3. `search.dto.ts`:
   - `SearchFilterDTO`
   - `SearchResultDTO`
   - `FacetBucketDTO`
4. `seo.dto.ts`:
   - `SeoMetadataDTO`
   - `OpenGraphDTO`

---

## 9. MIDDLEWARE INVENTORY

Located in `src/backend/middlewares/`:

1. `auth.ts`:
   - `authenticate`: Validates Admin JWT token from `Authorization: Bearer <token>`.
   - `requirePermission(module, action)`: Enforces RBAC permissions check. SuperAdmin bypasses all checks.
2. `customerAuth.ts`:
   - `authenticateCustomer`: Validates Storefront Customer JWT token.
3. `errorHandler.ts`:
   - Global Express error handling middleware that captures `AppError` instances and returns consistent JSON errors `{ status, errorCode, message }`.
4. `rateLimiter.ts`:
   - Express rate-limiting middleware to guard authentication and payment routes against brute-force attacks.
5. `validation.ts`:
   - Zod schema validation middleware for admin request bodies and parameters.
6. `storefront/validation.middleware.ts`:
   - Validation middleware for storefront user inputs (e.g., checkout address, coupon code).
7. `storefront/logging.middleware.ts`:
   - Request logging and customer event tracking middleware.

---

## 10. RBAC INVENTORY

### RBAC System Structure
- **Roles**: Defined in `Role` model (e.g. `SuperAdmin`, `Admin`, `Manager`, `Staff`, `Support`).
- **Permissions**: Defined in `Permission` model containing `module` and `action` pairs.
- **Bypass Rule**: `SuperAdmin` automatically bypasses all permission checks in `requirePermission`.

### Action Types
- `read`
- `create`
- `update`
- `delete`
- `manage`

### Module Matrix
| Module Name | Description | Key Protected Actions |
|-------------|-------------|-----------------------|
| `PRODUCTS` | Catalog Products & Variants | `read`, `create`, `update`, `delete` |
| `CATEGORIES` | Catalog Categories | `read`, `create`, `update`, `delete` |
| `BRANDS` | Catalog Brands | `read`, `create`, `update`, `delete` |
| `INVENTORY` | Stock Levels & Warehouses | `read`, `update` |
| `ORDERS` | Purchase Orders & Notes | `read`, `update`, `delete`, `assign` |
| `CUSTOMERS` | Customer Accounts & Notes | `read`, `update`, `delete` |
| `PAYMENTS` | Payment Transactions | `read`, `update` |
| `REFUNDS` | Refund Approvals | `read`, `create`, `process` |
| `RETURNS` | Return Requests & Restock | `read`, `approve`, `reject`, `receive` |
| `SHIPMENTS` | Fulfillment & Courier Dispatch | `read`, `create`, `update` |
| `COUPONS` | Promotional Coupons | `read`, `create`, `update`, `delete` |
| `MARKETING` | Campaigns, Banners, Popups | `read`, `create`, `update`, `delete` |
| `CMS` | Pages, Blogs, Landing Pages, FAQs | `read`, `create`, `update`, `delete` |
| `MEDIA` | Cloudinary Media Assets | `read`, `upload`, `delete` |
| `USERS` | Staff User Accounts | `read`, `create`, `update`, `delete` |
| `ROLES` | RBAC Roles & Permissions | `read`, `create`, `update`, `delete` |
| `SETTINGS` | System Storefront Settings | `read`, `update` |
| `AUDIT_LOGS` | System Audit Trails | `read` |

---
*End of Physical Project Inventory Document.*
