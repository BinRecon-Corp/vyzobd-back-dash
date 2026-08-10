# Platform Architecture & System Design

## 1. High-Level Architecture
This eCommerce platform is built as a modular monolithic Express architecture serving two single-page applications (Storefront and Admin) through separate REST API namespaces (`/api/v1` and `/api/storefront/v1`).

```
+-----------------------------------------------------------------------------------+
|                               Client Applications                                 |
|   +------------------------------------+    +---------------------------------+   |
|   |   Storefront Customer Portal       |    |   Admin & Back-office OMS       |   |
|   |   (React 19 + TanStack Query)      |    |   (React 19 + Zustand + Lucide) |   |
|   +------------------------------------+    +---------------------------------+   |
+----------------------------------------+------------------------------------------+
                                         |
                                         | HTTPS / REST Calls
                                         v
+-----------------------------------------------------------------------------------+
|                         Express Gateway / Middleware Layer                        |
|  - Helmet Security (CSP, HSTS, X-Frame)   - Rate Limiting (Express Rate Limit)    |
|  - Restricted CORS (Allowed Origins)      - Input Sanitization & Zod Validation   |
|  - Admin Auth (JWT + RBAC Middleware)     - Customer Auth (JWT Session Tokens)    |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                             Domain Controllers & Services                         |
|  +--------------------+  +--------------------+  +--------------------+           |
|  | Catalog & Products |  | OMS, Orders & RMA  |  | Customer & Auth    |           |
|  +--------------------+  +--------------------+  +--------------------+           |
|  +--------------------+  +--------------------+  +--------------------+           |
|  | Inventory & Stocks |  | Payments & Refunds |  | CMS & Analytics    |           |
|  +--------------------+  +--------------------+  +--------------------+           |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                            Prisma ORM & PostgreSQL Database                       |
|  - Transactional ACID Operations          - Parameterized Queries                 |
|  - Connection Pooling                     - Relational Data Models                |
+-----------------------------------------------------------------------------------+
```

## 2. Component Layers

### 2.1 Router Layer
- **Admin Routers** (`/src/backend/routes/*.routes.ts`): Mounted under `/api/v1`. Protected by `requireAuth` and granular permission verification (`requirePermission('products:read')`).
- **Storefront Routers** (`/src/backend/routes/storefront/*.routes.ts`): Mounted under `/api/storefront/v1`. Public routes accessible freely; protected customer routes guarded by `requireCustomerAuth`.

### 2.2 Middleware Layer
- **Helmet Middleware**: Secures HTTP headers against XSS, clickjacking, and mime-type sniffing.
- **CORS Middleware**: Rejects unauthorized domain requests in production.
- **Global & Endpoint Rate Limiters**: Prevents brute-force attacks and DDOS traffic.
- **Sanitization Middleware**: Recursively strips script tags and malicious HTML payloads.
- **Authentication & RBAC**: Verifies Bearer JWTs, checks token revocation, and matches role permissions against database definitions.

### 2.3 Service Layer
All business logic is isolated in services (`/src/backend/services/` and `/src/backend/services/storefront/`). Controllers deal purely with HTTP request parsing, response formatting, and error forwarding.

### 2.4 Data Layer
Managed via Prisma ORM v5.22 talking to a PostgreSQL 15+ database. ACID compliance is enforced for orders, payments, stock reservations, and customer balances using `prisma.$transaction`.

## 3. Data Flow Scenarios

### Order Placement Flow
1. Customer initiates checkout request (`POST /api/storefront/v1/checkout/session`).
2. Cart items and active inventory levels are validated in a Prisma transaction.
3. Stock amounts are reserved in `Inventory`.
4. Order record, OrderItems, and initial OrderTimeline entries are created with status `PENDING`.
5. Payment intent is created via provider gateway (Stripe, Paypal, SSLCommerz).
6. Gateway webhook fires `POST /api/storefront/v1/payment/webhook/:provider`.
7. Webhook verifies signature, records `PaymentWebhookLog`, updates Order status to `PROCESSING`, and sends customer notification.
