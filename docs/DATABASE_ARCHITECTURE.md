# DATABASE ARCHITECTURE SPECIFICATION & SCHEMA REFERENCE

**Project Engine:** PostgreSQL via Prisma ORM  
**Schema File:** `prisma/schema.prisma`  
**Total Database Models:** 73 Entities  
**Total Enumerations:** 10 Enums  

---

## 1. OVERVIEW & ARCHITECTURAL PRINCIPLES

The system persistence layer is built on PostgreSQL, using **Prisma ORM** for schema migrations, type-safe data access, and transactional consistency.

### Core Architectural Mandates
1. **Primary Key Strategy:** All entities utilize globally unique, collision-resistant string IDs (`@id @default(cuid())`), providing secure and unpredictable identifiers across distributed systems.
2. **Precision Financial Decimal Storage:** All monetary figures (`price`, `subtotal`, `taxAmount`, `shippingAmount`, `discountAmount`, `totalAmount`, `refundedAmount`, `amount`) are stored using `@db.Decimal(10,2)` (or arbitrary-precision `Prisma.Decimal`). Standard IEEE 754 floating-point numbers (`Float`) are strictly prohibited for financial data to prevent rounding drift.
3. **Auditability & Lifecycle Tracking:** Every model mandates automatic audit timestamp fields:
   - `createdAt DateTime @default(now())`
   - `updatedAt DateTime @updatedAt`
4. **Soft Delete Preservation:** Strategic core entities utilize soft deletion (`deletedAt DateTime?`) to maintain historical integrity for orders, reporting, and customer audit trails without risking database corruption or foreign key breaking.
5. **ACID Transaction Boundaries:** Multi-record state updates (such as checkout, payment status progression, inventory decrementing, and refund issuance) execute strictly inside `prisma.$transaction()` blocks.

---

## 2. ENUMERATIONS INVENTORY

| Enum Name | Values | Business Purpose |
|-----------|--------|------------------|
| `PaymentStatus` | `PENDING`, `PROCESSING`, `PAID`, `FAILED`, `CANCELLED`, `REFUNDED` | Tracks financial settlement state across order payments. |
| `PaymentProvider` | `COD`, `BKASH`, `NAGAD`, `SSLCOMMERZ`, `STRIPE` | Supported payment gateways and settlement channels. |
| `RefundStatus` | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `REJECTED` | Governance lifecycle for partial or full refund requests. |
| `ShipmentStatus` | `PENDING`, `PROCESSING`, `PACKED`, `SHIPPED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED_DELIVERY`, `RETURNED` | Granular fulfillment stages for dispatched packages. |
| `TrackingStatus` | `INFO_RECEIVED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `EXCEPTION` | Real-time courier movement status updates. |
| `ReturnStatus` | `REQUESTED`, `APPROVED`, `REJECTED`, `RECEIVED`, `REFUND_PENDING`, `REFUNDED`, `CLOSED` | Customer return application and restock lifecycle. |
| `NotificationType` | `ORDER_CREATED`, `PAYMENT_SUCCESS`, `PAYMENT_FAILED`, `ORDER_SHIPPED`, `OUT_FOR_DELIVERY`, `ORDER_DELIVERED`, `RETURN_REQUESTED`, `RETURN_APPROVED`, `REFUND_COMPLETED`, `ACCOUNT_SECURITY`, `GENERAL` | System notification event classification. |
| `NotificationChannel` | `EMAIL`, `SMS`, `IN_APP` | Transmission medium for customer messaging. |
| `NotificationStatus` | `PENDING`, `SENT`, `FAILED`, `READ` | Delivery status for sent messages. |
| `ActivityType` | `REGISTER`, `LOGIN`, `LOGOUT`, `PROFILE_UPDATED`, `ADDRESS_CREATED`, `ADDRESS_UPDATED`, `WISHLIST_ADD`, `WISHLIST_REMOVE`, `CART_ADD`, `CART_UPDATE`, `CART_REMOVE`, `CHECKOUT_STARTED` | Audit event classification for storefront analytics. |

---

## 3. PRODUCT & CATALOG SUBSYSTEM

### Models Architecture

#### 1. `Product`
- **Purpose:** Core catalog product record.
- **Fields:** `id`, `name`, `slug` (unique), `description`, `shortDescription`, `categoryId`, `brandId`, `vendorId`, `status`, `isActive`, `isFeatured`, `basePrice`, `salePrice`, `costPrice`, `sku` (unique), `barcode`, `weight`, `dimensions`, `metaTitle`, `metaDescription`, `deletedAt`, `createdAt`, `updatedAt`.
- **Relations:** Belongs to `Category`, `Brand`, `Vendor`. Has many `ProductVariant`, `ProductImage`, `ProductTag`, `Inventory`, `Review`, `WishlistItem`, `CartItem`, `OrderItem`.
- **Indexes:** `categoryId`, `brandId`, `vendorId`, `status`, `[isActive, deletedAt, categoryId]`, `[isActive, deletedAt, brandId]`, `[status, deletedAt]`.

#### 2. `ProductVariant`
- **Purpose:** Specific purchasable SKU options (e.g., Size: L, Color: Blue).
- **Fields:** `id`, `productId`, `name`, `sku` (unique), `barcode`, `price`, `compareAtPrice`, `costPrice`, `stock`, `weight`, `isActive`, `deletedAt`, `createdAt`, `updatedAt`.
- **Relations:** Belongs to `Product`. Has many `VariantAttributeValue`, `Inventory`, `ProductImage`, `CartItem`, `OrderItem`.

#### 3. `Category` & `CategoryImage`
- **Purpose:** Hierarchical taxonomy tree for products.
- **Fields:** `Category`: `id`, `name`, `slug` (unique), `description`, `parentId`, `orderIndex`, `isActive`, `deletedAt`, `createdAt`, `updatedAt`. `CategoryImage`: `id`, `categoryId`, `url`, `altText`.
- **Relations:** Self-referential hierarchy (`parent`/`children`). Has many `Product`, `CategoryImage`.

#### 4. `Brand` & `BrandImage`
- **Purpose:** Product manufacturers and brand entities.
- **Fields:** `Brand`: `id`, `name`, `slug` (unique), `logoUrl`, `description`, `isActive`, `deletedAt`, `createdAt`, `updatedAt`. `BrandImage`: `id`, `brandId`, `url`, `altText`.

#### 5. `Tag` & `ProductTag`
- **Purpose:** Freeform tags for catalog search and grouping.
- **Fields:** Many-to-many join model connecting `Product` and `Tag`.

#### 6. `Attribute`, `AttributeValue`, & `VariantAttributeValue`
- **Purpose:** Dynamic variant dimension specifications (e.g., Attribute: Color -> Values: Red, Blue, Green).
- **Relations:** `Attribute` has many `AttributeValue`. `VariantAttributeValue` maps `ProductVariant` to `AttributeValue`.

#### 7. `ProductImage`
- **Purpose:** Gallery imagery for products and variants.
- **Fields:** `id`, `productId`, `productVariantId`, `url`, `altText`, `isPrimary`, `orderIndex`, `deletedAt`.

#### 8. `Inventory`
- **Purpose:** Multi-warehouse stock tracking engine.
- **Fields:** `id`, `warehouseId`, `productId`, `variantId`, `quantityTotal`, `quantityReserved`, `quantityAvailable`, `reorderPoint`, `deletedAt`.
- **Constraints & Indexes:** `@@unique([warehouseId, variantId])`.

#### 9. `Review`
- **Purpose:** Customer product ratings and reviews.
- **Fields:** `id`, `productId`, `customerId`, `rating`, `title`, `comment`, `isApproved`, `deletedAt`.

---

## 4. CUSTOMER & ENGAGEMENT SUBSYSTEM

#### 1. `Customer`
- **Purpose:** Master customer account entity.
- **Fields:** `id`, `email` (unique), `phone`, `firstName`, `lastName`, `passwordHash`, `isVerified`, `isActive`, `rewardPoints`, `balance`, `deletedAt`, `createdAt`, `updatedAt`.
- **Relations:** Has many `CustomerAddress`, `CustomerRefreshToken`, `Wishlist`, `Cart`, `Order`, `Payment`, `Refund`, `ReturnRequest`, `Notification`, `NotificationPreference`, `CustomerActivity`.

#### 2. `CustomerAddress`
- **Purpose:** Saved shipping and billing locations.
- **Fields:** `id`, `customerId`, `type`, `addressLine1`, `addressLine2`, `city`, `state`, `postalCode`, `country`, `isDefault`.

#### 3. `CustomerRefreshToken`
- **Purpose:** Secure OAuth / JWT storefront session refresh tokens.
- **Fields:** `id`, `customerId`, `tokenHash` (unique), `expiresAt`, `createdAt`.

#### 4. `Wishlist` & `WishlistItem`
- **Purpose:** Saved favorite items for future purchase.
- **Constraints:** `@@unique([wishlistId, productId])`.

#### 5. `Cart` & `CartItem`
- **Purpose:** Persistent shopping cart session.
- **Fields:** `Cart`: `id`, `customerId` (unique, nullable), `sessionId`, `couponId`, `subtotal`, `discountAmount`, `totalAmount`, `createdAt`, `updatedAt`.
- **Relations:** Has many `CartItem`. Linked to `AbandonedCart`.

#### 6. `AbandonedCart`
- **Purpose:** Automated cart recovery and remarketing tracking.
- **Fields:** `id`, `cartId` (unique), `customerId`, `recoveredOrderId` (unique, nullable), `isRecovered`, `recoveredAt`, `createdAt`.

#### 7. `Notification` & `NotificationPreference`
- **Purpose:** In-app and multi-channel customer communications.
- **Fields:** Types (`NotificationType`), channels (`NotificationChannel`), status (`NotificationStatus`).

#### 8. `CustomerActivity`
- **Purpose:** Audit log stream for storefront behavioral actions (`ActivityType`).

---

## 5. FINANCIAL, ORDER & PAYMENT SUBSYSTEM

#### 1. `Order`
- **Purpose:** Core financial purchase order ledger.
- **Fields:** `id`, `orderNumber` (unique), `customerId`, `status`, `paymentStatus`, `fulfillmentStatus`, `currency`, `subtotal` (`Decimal`), `discountAmount` (`Decimal`), `taxAmount` (`Decimal`), `shippingAmount` (`Decimal`), `totalAmount` (`Decimal`), `refundedAmount` (`Decimal`), `couponId`, `assignedStaffId`, `notes`, `deletedAt`, `createdAt`, `updatedAt`.
- **Relations:** Has many `OrderItem`, `OrderTimeline`, `OrderNote`, `Payment`, `Refund`, `Shipment`, `ReturnRequest`.
- **Indexes:** `customerId`, `status`, `createdAt`, `[customerId, createdAt]`, `[status, createdAt]`.

#### 2. `OrderItem`
- **Purpose:** Snapshot of purchased items within an order.
- **Fields:** `id`, `orderId`, `productId`, `productVariantId`, `productName`, `sku`, `unitPrice` (`Decimal`), `quantity`, `totalPrice` (`Decimal`).

#### 3. `OrderTimeline` & `OrderNote`
- **Purpose:** Immutable audit trail for status transitions and internal staff comments.

#### 4. `Payment`
- **Purpose:** Settlement tracking record for orders.
- **Fields:** `id`, `orderId`, `customerId`, `provider` (`PaymentProvider`), `status` (`PaymentStatus`), `amount` (`Decimal`), `currency`, `transactionReference`, `gatewayResponse`, `createdAt`, `updatedAt`.
- **Relations:** Has many `PaymentTransaction`, `Refund`.

#### 5. `PaymentTransaction` & `PaymentWebhookLog`
- **Purpose:** Raw gateway payloads and immutable webhook audit log for audit compliance.

#### 6. `Refund` & `RefundTransaction`
- **Purpose:** Partial and full refund execution ledger.
- **Fields:** `Refund`: `id`, `paymentId`, `orderId`, `customerId`, `amount` (`Decimal`), `currency`, `status` (`RefundStatus`), `reason`, `transactionReference`, `completedAt`, `createdAt`.
- **Relations:** Has many `RefundTransaction`.

#### 7. `Coupon` & `Promotion`
- **Purpose:** Discount engine definitions.
- **Fields:** `Coupon`: `id`, `code` (unique), `discountType`, `discountValue` (`Decimal`), `minOrderAmount` (`Decimal`), `maxDiscountAmount`, `usageLimit`, `usedCount`, `validFrom`, `validUntil`, `isActive`, `deletedAt`.

---

## 6. LOGISTICS & FULFILLMENT SUBSYSTEM

#### 1. `Warehouse` & `Vendor`
- **Purpose:** Physical stock storage locations and third-party supplier management.

#### 2. `Courier`
- **Purpose:** Integrated delivery service provider accounts.

#### 3. `Shipment`, `ShipmentItem`, & `TrackingEvent`
- **Purpose:** Package dispatch, item packing, and carrier tracking events.
- **Fields:** `Shipment`: `id`, `orderId`, `courierId`, `trackingNumber`, `status` (`ShipmentStatus`), `shippedAt`, `deliveredAt`.

#### 4. `ReturnRequest` & `ReturnItem`
- **Purpose:** Customer return applications, staff approval, and automatic inventory restock workflow.
- **Fields:** `ReturnRequest`: `id`, `orderId`, `customerId`, `status` (`ReturnStatus`), `reason`, `refundAmount` (`Decimal`), `approvedAt`, `receivedAt`.

---

## 7. CMS, MARKETING & SYSTEM GOVERNANCE SUBSYSTEM

#### 1. `User`, `RefreshToken`, `Role`, `Permission`
- **Purpose:** Staff administrative user accounts, JWT tokens, and RBAC permissions grid (`@@unique([module, action])`).

#### 2. `ActivityLog`
- **Purpose:** Security audit log recording staff user actions across entities.

#### 3. `Page`, `PageVersion`, `LandingPage`, `BlogPost`, `BlogCategory`, `BlogTag`, `FAQCategory`, `FAQ`
- **Purpose:** Storefront CMS pages, marketing landing pages, blog publisher, and structured customer support FAQs.

#### 4. `SeoMetadata` & `GlobalSeoSettings`
- **Purpose:** Meta titles, descriptions, canonical URLs, and OpenGraph parameters.

#### 5. `MediaAsset`
- **Purpose:** Centralized Cloudinary image metadata registry.

#### 6. `Setting` & Store Configuration Models
- **Purpose:** Domain settings: `BrandingSetting`, `SEOSetting`, `SMTPSetting`, `AnalyticsSetting`, `SecuritySetting`, `ShippingSetting`, `TaxSetting`.

---

## 8. REFERENTIAL INTEGRITY & CASCADE DELETE RULES

Prisma `onDelete` cascade rules are strictly configured to maintain consistency and avoid orphan records:

### `onDelete: Cascade` Rules
- **Authentication & Users:** `User` -> `RefreshToken`
- **Customers:** `Customer` -> `CustomerNote`, `CustomerAddress`, `CustomerRefreshToken`, `Wishlist`, `Cart`, `Payment`, `Refund`, `ReturnRequest`, `Notification`, `NotificationPreference`, `CustomerActivity`
- **Catalog:** `Product` -> `ProductTag`, `ProductVariant`, `ProductImage`, `Inventory` (product level), `WishlistItem`, `CartItem`
- **Variants:** `ProductVariant` -> `VariantAttributeValue`, `CartItem`, `Inventory` (variant level)
- **Orders:** `Order` -> `OrderItem`, `OrderTimeline`, `OrderNote`, `Payment`, `Refund`, `Shipment`, `ReturnRequest`
- **Cart & Wishlist:** `Wishlist` -> `WishlistItem`, `Cart` -> `CartItem`, `AbandonedCart`
- **Financial Transactions:** `Payment` -> `PaymentTransaction`, `Refund` -> `RefundTransaction`
- **Fulfillment & Returns:** `Shipment` -> `ShipmentItem`, `TrackingEvent`, `ReturnRequest` -> `ReturnItem`
- **Taxonomy & Attributes:** `Category` -> `CategoryImage`, `Brand` -> `BrandImage`, `Attribute` -> `AttributeValue`
- **CMS:** `Page` -> `PageVersion`

### `onDelete: SetNull` Rules (Preserving Historical Data)
- `ProductVariant` -> `OrderItem` (Deletions of product variants retain historical order line items intact with `null` variant references).
- `ProductVariant` -> `ProductImage` (Deleting a variant disassociates the image without deleting the master image asset).
- `Customer` -> `AnalyticsEvent`, `AbandonedCart` (Retains analytics and sales conversion telemetry even if customer accounts are closed).
- `Order` -> `AbandonedCart` (Retains cart recovery analytics when orders are deleted).

---

## 9. SOFT DELETE IMPLEMENTATION STRATEGY

To safeguard against accidental data destruction and preserve audit capability, 23 core entities implement soft deletion via `deletedAt DateTime?`:

### Soft-Deleted Models
1. `User`
2. `Role`
3. `Customer`
4. `Vendor`
5. `Warehouse`
6. `Category`
7. `Brand`
8. `Product`
9. `ProductVariant`
10. `ProductImage`
11. `Inventory`
12. `Order`
13. `Coupon`
14. `Promotion`
15. `MarketingCampaign`
16. `Banner`
17. `Popup`
18. `Review`
19. `Page`
20. `LandingPage`
21. `BlogPost`
22. `MediaAsset`
23. `FAQ`

### Soft Delete Enforcement Patterns
In code services, active queries MUST include:
```typescript
where: {
  deletedAt: null,
  isActive: true
}
```

---

## 10. DATABASE INDEXING & PERFORMANCE OPTIMIZATIONS

### Single-Column Foreign Key Indexes
All foreign keys are explicitly indexed to eliminate full table scans during JOIN operations (e.g. `categoryId`, `brandId`, `customerId`, `orderId`, `warehouseId`, `productId`, `variantId`, `paymentId`, `shipmentId`, `returnRequestId`).

### Compound & Composite Indexes
1. **Catalog Search & Filtering:**
   - `Product`: `@@index([isActive, deletedAt, categoryId])`
   - `Product`: `@@index([isActive, deletedAt, brandId])`
   - `Product`: `@@index([status, deletedAt])`
2. **Customer Activity & History:**
   - `Customer`: `@@index([isActive, deletedAt])`
   - `Order`: `@@index([customerId, createdAt])`
   - `Order`: `@@index([status, createdAt])`
   - `Payment`: `@@index([status, createdAt])`
   - `Shipment`: `@@index([status, createdAt])`
   - `Notification`: `@@index([customerId, status])`
3. **Audit Trails & Telemetry:**
   - `ActivityLog`: `@@index([entityType, entityId])`
   - `AnalyticsEvent`: `@@index([eventName])`, `@@index([sessionId])`
4. **Composite Unique Constraints:**
   - `Permission`: `@@unique([module, action])`
   - `Inventory`: `@@unique([warehouseId, variantId])`
   - `WishlistItem`: `@@unique([wishlistId, productId])`

---
*End of Database Architecture Specification & Schema Reference.*
