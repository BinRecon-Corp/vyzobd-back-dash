# END-TO-END CUSTOMER JOURNEY & STATE FLOW SPECIFICATION

This document details the complete end-to-end customer lifecycle for the e-commerce platform — from user registration and product discovery to order fulfillment, shipping, returns, and refunds.

---

## 1. HIGH-LEVEL CUSTOMER LIFECYCLE OVERVIEW

```mermaid
graph TD
    A[1. Registration & Auth] --> B[2. Product Discovery]
    B --> C[3. Wishlist Management]
    B --> D[4. Cart Operations]
    D --> E[5. Checkout Session]
    E --> F[6. Payment Processing]
    F --> G[7. Order Placement & State Lifecycle]
    G --> H[8. Shipment & Delivery Tracking]
    H --> I[9. Return Request & Inspection]
    I --> J[10. Refund Processing & Wallet Settlement]
```

---

## 2. SEQUENCE DIAGRAMS BY LIFECYCLE STAGE

### 2.1 Customer Registration & Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Frontend as Storefront UI
    participant AuthAPI as Storefront Auth API
    participant DB as PostgreSQL Database

    Customer->>Frontend: Fills Registration Form (Email, Password, Name)
    Frontend->>AuthAPI: POST /api/storefront/v1/auth/register
    AuthAPI->>DB: Check duplicate email in Customer table
    DB-->>AuthAPI: No conflict found
    AuthAPI->>AuthAPI: Hash password (Bcrypt) & create Customer record
    AuthAPI->>DB: Insert Customer & Refresh Token Session
    DB-->>AuthAPI: Customer Created
    AuthAPI-->>Frontend: 201 Created (Customer DTO, JWT Access Token, Refresh Token)
    Frontend-->>Customer: Authenticated & Session Stored in LocalStorage

    Customer->>Frontend: Subsequent Login Request
    Frontend->>AuthAPI: POST /api/storefront/v1/auth/login
    AuthAPI->>DB: Query Customer by Email
    DB-->>AuthAPI: Customer Record & Hashed Password
    AuthAPI->>AuthAPI: Verify Password Hash
    AuthAPI->>DB: Create Refresh Token Session
    AuthAPI-->>Frontend: 200 OK (JWT Access Token & Refresh Token)
```

---

### 2.2 Product Discovery & Search Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Frontend as Storefront UI
    participant CatalogAPI as Storefront Catalog API
    participant SearchService as Search & Facet Engine
    participant DB as PostgreSQL Database

    Customer->>Frontend: Browse Catalog with filters (Category, Price, Sort)
    Frontend->>CatalogAPI: GET /api/storefront/v1/products?category=audio&minPrice=50&sort=price_asc
    CatalogAPI->>DB: Query Active Products, Variants, Primary Images, Brands
    DB-->>CatalogAPI: Raw Product Collections & Total Count
    CatalogAPI-->>Frontend: 200 OK (Paginated Products DTO + GA4 Tracking Payload)

    Customer->>Frontend: Enters Keyword Search ("wireless earbuds")
    Frontend->>SearchService: GET /api/storefront/v1/search?q=wireless+earbuds
    SearchService->>DB: Full-text search across Name, Description, SKU
    DB-->>SearchService: Matched Product Items
    SearchService-->>Frontend: 200 OK (Search Result List)

    Frontend->>SearchService: GET /api/storefront/v1/search/facets?q=wireless+earbuds
    SearchService->>DB: Aggregate counts for Categories, Brands, Price Range
    DB-->>SearchService: Aggregation Buckets
    SearchService-->>Frontend: 200 OK (Facet Distributions)
```

---

### 2.3 Wishlist & Cart Operations Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Frontend as Storefront UI
    participant WishlistAPI as Wishlist API
    participant CartAPI as Cart API
    participant DB as PostgreSQL Database

    Note over Customer, DB: Wishlist Operations
    Customer->>Frontend: Click "Add to Wishlist" on Product Card
    Frontend->>WishlistAPI: POST /api/storefront/v1/wishlist/:productId (Bearer Token)
    WishlistAPI->>DB: Upsert Wishlist & WishlistItem record
    DB-->>WishlistAPI: Saved
    WishlistAPI-->>Frontend: 200 OK ("Item added to wishlist")

    Note over Customer, DB: Cart Management
    Customer->>Frontend: Select Variant & Click "Add to Cart"
    Frontend->>CartAPI: POST /api/storefront/v1/cart/items (productId, variantId, quantity: 1)
    CartAPI->>DB: Fetch or Create Customer Active Cart
    CartAPI->>DB: Check Variant Stock Availability
    DB-->>CartAPI: Stock Available
    CartAPI->>DB: Upsert CartItem line item & recalculate Subtotal
    DB-->>CartAPI: Cart Updated
    CartAPI-->>Frontend: 200 OK (Updated Cart DTO with Total Amount)
```

---

### 2.4 Checkout & Payment Execution Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Frontend as Storefront UI
    participant CheckoutAPI as Checkout API
    participant PaymentAPI as Payment Gateway API
    participant Gateway as External Gateway (bKash/SSLCommerz/Stripe)
    participant DB as PostgreSQL Database

    Customer->>Frontend: Navigate to Checkout Page
    Frontend->>CheckoutAPI: GET /api/storefront/v1/checkout/session
    CheckoutAPI->>DB: Calculate Subtotal, Tax, Shipping Fees
    DB-->>CheckoutAPI: Session Totals
    CheckoutAPI-->>Frontend: 200 OK (Checkout Summary)

    Customer->>Frontend: Enter Promo Coupon ("SUMMER20")
    Frontend->>CheckoutAPI: POST /api/storefront/v1/checkout/coupon
    CheckoutAPI->>DB: Validate Coupon limits, minimum order & expiration
    DB-->>CheckoutAPI: Coupon Valid
    CheckoutAPI-->>Frontend: 200 OK (Discounted Summary)

    Customer->>Frontend: Select Payment Method & Click "Place Order"
    Frontend->>CheckoutAPI: POST /api/storefront/v1/checkout/complete
    CheckoutAPI->>DB: Begin DB Transaction
    CheckoutAPI->>DB: Verify Stock & Reserve Inventory
    CheckoutAPI->>DB: Create Order (Status: PENDING) & OrderItems
    CheckoutAPI->>DB: Clear Active Cart
    CheckoutAPI->>DB: Commit DB Transaction
    DB-->>CheckoutAPI: Order Created
    CheckoutAPI-->>Frontend: 201 Created (Order Number & Details)

    Customer->>Frontend: Proceed to Online Payment
    Frontend->>PaymentAPI: POST /api/storefront/v1/payment/initiate (orderId, provider)
    PaymentAPI->>Gateway: Create Gateway Checkout Session
    Gateway-->>PaymentAPI: Gateway Payment URL & Token
    PaymentAPI-->>Frontend: 200 OK (redirectUrl)
    Frontend->>Gateway: Redirect User to Gateway
    Gateway-->>Frontend: Payment Success Webhook/Callback
    Frontend->>PaymentAPI: POST /api/storefront/v1/payment/verify (paymentId, trxRef)
    PaymentAPI->>DB: Update Payment (PAID) & Order Status (PROCESSING)
    DB-->>PaymentAPI: Updated
    PaymentAPI-->>Frontend: 200 OK (Payment Verified)
```

---

### 2.5 Order Fulfillment, Shipment & Tracking Flow

```mermaid
sequenceDiagram
    autonumber
    actor AdminStaff as Operations Staff
    actor Customer
    participant AdminAPI as Admin Operations API
    participant StorefrontAPI as Storefront API
    participant DB as PostgreSQL Database

    AdminStaff->>AdminAPI: View Processing Orders
    AdminAPI->>DB: Query Orders with status = PROCESSING
    DB-->>AdminAPI: Order List

    AdminStaff->>AdminAPI: Create Shipment (POST /api/v1/shipments)
    AdminAPI->>DB: Create Shipment & ShipmentItems (Tracking Number, Courier)
    AdminAPI->>DB: Update Order Status to SHIPPED
    AdminAPI->>DB: Create Notification for Customer
    DB-->>AdminAPI: Shipment Created

    Customer->>StorefrontAPI: GET /api/storefront/v1/orders/:id/shipments
    StorefrontAPI->>DB: Fetch Shipments, Courier Tracking URL & Events
    DB-->>StorefrontAPI: Shipment Data
    StorefrontAPI-->>Customer: 200 OK (Tracking details, estimated delivery date)
```

---

### 2.6 Return & Refund Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    actor AdminStaff as Customer Support
    participant StorefrontAPI as Storefront API
    participant AdminAPI as Admin Management API
    participant DB as PostgreSQL Database

    Customer->>StorefrontAPI: POST /api/storefront/v1/returns/request (orderId, items, reason)
    StorefrontAPI->>DB: Verify Order Delivery & Return Window
    StorefrontAPI->>DB: Create ReturnRequest record (Status: REQUESTED)
    DB-->>StorefrontAPI: Return Request Created
    StorefrontAPI-->>Customer: 201 Created ("Return request submitted")

    AdminStaff->>AdminAPI: Review Return Applications
    AdminStaff->>AdminAPI: POST /api/v1/returns/:id/approve
    AdminAPI->>DB: Update ReturnRequest Status to APPROVED
    DB-->>AdminAPI: Approved

    AdminStaff->>AdminAPI: Inspect Received Goods & Restock (POST /api/v1/returns/:id/receive)
    AdminAPI->>DB: Increment Inventory stock quantity (quantityAvailable)
    AdminAPI->>DB: Update ReturnRequest Status to RECEIVED
    DB-->>AdminAPI: Restocked

    AdminStaff->>AdminAPI: Process Refund (POST /api/v1/refunds)
    AdminAPI->>DB: Create Refund record (Status: COMPLETED)
    AdminAPI->>DB: Update Order Payment Status to REFUNDED
    DB-->>AdminAPI: Refund Settled
    AdminAPI-->>Customer: Dispatch Refund Notification
```

---

## 3. STATE TRANSITION MAP

### 3.1 Order State Lifecycle Machine
```
[ PENDING ] ──(Payment Settled / COD Confirmed)──> [ PROCESSING ]
     │                                                    │
 (Cancelled)                                         (Fulfillment)
     ▼                                                    ▼
[ CANCELLED ]                                        [ SHIPPED ]
                                                          │
                                                     (Delivered)
                                                          ▼
                                                   [ DELIVERED ]
```

### 3.2 Return Request Lifecycle Machine
```
[ REQUESTED ] ──(Admin Review)──> [ APPROVED ] ──(Customer Ships Back)──> [ RECEIVED ]
      │                                                                         │
 (Rejected)                                                            (Restock & Refund)
      ▼                                                                         ▼
 [ REJECTED ]                                                             [ COMPLETED ]
```

---

## 4. COMPLETE STEP-BY-STEP API STEP SUMMARY

| Step | User Action | API Endpoint | Auth Header | Primary DB Action |
|------|-------------|--------------|-------------|-------------------|
| **1** | Register Account | `POST /api/storefront/v1/auth/register` | Public | Creates `Customer` & hashes password |
| **2** | Login Session | `POST /api/storefront/v1/auth/login` | Public | Generates JWT & inserts `Session` |
| **3** | Browse Products | `GET /api/storefront/v1/products` | Public | Queries `Product` with variants & images |
| **4** | Add to Wishlist | `POST /api/storefront/v1/wishlist/:id` | Bearer Customer | Inserts `WishlistItem` |
| **5** | Add to Cart | `POST /api/storefront/v1/cart/items` | Bearer Customer | Inserts/Updates `CartItem` |
| **6** | View Checkout | `GET /api/storefront/v1/checkout/session` | Bearer Customer | Calculates subtotal, tax & shipping |
| **7** | Apply Coupon | `POST /api/storefront/v1/checkout/coupon` | Bearer Customer | Validates & applies discount |
| **8** | Place Order | `POST /api/storefront/v1/checkout/complete` | Bearer Customer | Creates `Order`, reserves stock & clears cart |
| **9** | Pay Online | `POST /api/storefront/v1/payment/initiate` | Bearer Customer | Creates gateway token & payment link |
| **10** | Verify Payment | `POST /api/storefront/v1/payment/verify` | Bearer Customer | Marks `Payment` PAID & `Order` PROCESSING |
| **11** | Track Shipment | `GET /api/storefront/v1/orders/:id/shipments` | Bearer Customer | Queries `Shipment` & courier events |
| **12** | Submit Return | `POST /api/storefront/v1/returns/request` | Bearer Customer | Creates `ReturnRequest` |
| **13** | Receive Refund | `GET /api/storefront/v1/refund` | Bearer Customer | Checks settled `Refund` status |

---

*End of End-to-End Customer Journey & State Flow Specification.*
