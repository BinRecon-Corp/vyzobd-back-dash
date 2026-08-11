# REST API CONTRACT & INTERFACE SPECIFICATION

**API Version:** v1  
**Base Admin API Path:** `/api/v1`  
**Base Storefront API Path:** `/api/storefront/v1`  
**Content-Type:** `application/json`  

---

## 1. GLOBAL RESPONSE & ERROR ARCHITECTURE

### Standard Success Response Format
All API responses follow a uniform JSON wrapper:
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Standard Error Response Format
Errors thrown by controllers or middlewares (`AppError`) return standardized HTTP status codes and JSON payloads:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "status": 401,
    "details": []
  }
}
```

### Common HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Entity successfully created.
- `400 Bad Request`: Validation failure or invalid parameters.
- `401 Unauthorized`: Missing or expired JWT authentication token.
- `403 Forbidden`: Insufficient RBAC permissions.
- `404 Not Found`: Target entity or route does not exist.
- `409 Conflict`: Unique constraint violation (e.g. duplicate email or SKU).
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Unhandled server exception.

---

## 2. ADMIN API ENDPOINTS (`/api/v1`)

### 2.1 AUTHENTICATION & SESSIONS (`/api/v1/auth`, `/api/v1/sessions`)

#### `POST /api/v1/auth/login`
- **Method:** POST
- **URL:** `/api/v1/auth/login`
- **Authentication:** None
- **Permission:** Public
- **Request Body:**
  ```json
  {
    "email": "admin@example.com",
    "password": "SecretPassword123!"
  }
  ```
- **Query Parameters:** None
- **Path Parameters:** None
- **Response Structure:**
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "string", "email": "string", "firstName": "string", "lastName": "string", "role": { "id": "string", "name": "string" } },
      "accessToken": "string",
      "refreshToken": "string"
    }
  }
  ```
- **Error Structure:** `401 Unauthorized` (`INVALID_CREDENTIALS`).

#### `POST /api/v1/auth/logout`
- **Method:** POST
- **URL:** `/api/v1/auth/logout`
- **Authentication:** Bearer Admin JWT
- **Permission:** Admin User
- **Request Body:**
  ```json
  {
    "refreshToken": "string"
  }
  ```
- **Query Parameters:** None
- **Path Parameters:** None
- **Response Structure:** `{ "success": true, "message": "Logged out successfully" }`
- **Error Structure:** `401 Unauthorized`.

#### `GET /api/v1/auth/me`
- **Method:** GET
- **URL:** `/api/v1/auth/me`
- **Authentication:** Bearer Admin JWT
- **Permission:** Admin User
- **Request Body:** None
- **Query Parameters:** None
- **Path Parameters:** None
- **Response Structure:**
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "string",
      "permissions": [ { "module": "string", "action": "string" } ]
    }
  }
  ```
- **Error Structure:** `401 Unauthorized`.

#### `GET /api/v1/sessions`
- **Method:** GET
- **URL:** `/api/v1/sessions`
- **Authentication:** Bearer Admin JWT
- **Permission:** `USERS:read`
- **Request Body:** None
- **Query Parameters:** `userId` (optional string)
- **Path Parameters:** None
- **Response Structure:** Array of active user refresh token sessions.
- **Error Structure:** `401 Unauthorized`, `403 Forbidden`.

#### `DELETE /api/v1/sessions/:id`
- **Method:** DELETE
- **URL:** `/api/v1/sessions/:id`
- **Authentication:** Bearer Admin JWT
- **Permission:** `USERS:write`
- **Request Body:** None
- **Query Parameters:** None
- **Path Parameters:** `id` (string UUID/CUID)
- **Response Structure:** `{ "success": true, "message": "Session revoked" }`
- **Error Structure:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

### 2.2 STAFF USERS & ROLES (`/api/v1/users`, `/api/v1/roles`, `/api/v1/permissions`)

#### `GET /api/v1/users`
- **Method:** GET
- **URL:** `/api/v1/users`
- **Authentication:** Bearer Admin JWT
- **Permission:** `USERS:read`
- **Query Parameters:** `page`, `limit`, `search`, `roleId`
- **Response Structure:** Paginated list of staff users.

#### `POST /api/v1/users`
- **Method:** POST
- **URL:** `/api/v1/users`
- **Authentication:** Bearer Admin JWT
- **Permission:** `USERS:create`
- **Request Body:**
  ```json
  {
    "email": "staff@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "password": "Password123!",
    "roleId": "string"
  }
  ```

#### `GET /api/v1/users/:id`
- **Method:** GET | **URL:** `/api/v1/users/:id` | **Permission:** `USERS:read`

#### `PUT /api/v1/users/:id`
- **Method:** PUT | **URL:** `/api/v1/users/:id` | **Permission:** `USERS:update`

#### `DELETE /api/v1/users/:id`
- **Method:** DELETE | **URL:** `/api/v1/users/:id` | **Permission:** `USERS:delete`

#### `GET /api/v1/roles`
- **Method:** GET | **URL:** `/api/v1/roles` | **Permission:** `ROLES:read`

#### `POST /api/v1/roles`
- **Method:** POST | **URL:** `/api/v1/roles` | **Permission:** `ROLES:create`
- **Request Body:** `{ "name": "Manager", "description": "Operations Manager", "permissions": ["prod_read", "order_write"] }`

#### `PATCH /api/v1/roles/:id/permissions`
- **Method:** PATCH | **URL:** `/api/v1/roles/:id/permissions` | **Permission:** `ROLES:write`
- **Request Body:** `{ "permissionIds": ["string"] }`

#### `GET /api/v1/permissions`
- **Method:** GET | **URL:** `/api/v1/permissions` | **Permission:** `PERMISSIONS:read`
- **Response Structure:** Array of available module-action permission pairs.

---

### 2.3 CATALOG & PRODUCTS (`/api/v1/products`, `/api/v1/variants`, `/api/v1/categories`, `/api/v1/brands`, `/api/v1/attributes`)

#### `GET /api/v1/products`
- **Method:** GET
- **URL:** `/api/v1/products`
- **Authentication:** Bearer Admin JWT
- **Permission:** `PRODUCTS:read`
- **Query Parameters:** `page`, `limit`, `search`, `categoryId`, `brandId`, `status`, `sortBy`
- **Response Structure:** Paginated list of catalog products with images and variants.

#### `POST /api/v1/products`
- **Method:** POST
- **URL:** `/api/v1/products`
- **Authentication:** Bearer Admin JWT
- **Permission:** `PRODUCTS:create`
- **Request Body:**
  ```json
  {
    "name": "Wireless Headphones",
    "slug": "wireless-headphones",
    "description": "Premium noise cancelling",
    "categoryId": "string",
    "brandId": "string",
    "basePrice": 199.99,
    "sku": "HEADPHONE-001",
    "status": "DRAFT",
    "images": [{ "url": "https://res.cloudinary.com/demo/image.png", "isPrimary": true }]
  }
  ```

#### `GET /api/v1/products/:id`
- **Method:** GET | **URL:** `/api/v1/products/:id` | **Permission:** `PRODUCTS:read`

#### `PUT /api/v1/products/:id`
- **Method:** PUT | **URL:** `/api/v1/products/:id` | **Permission:** `PRODUCTS:update`

#### `DELETE /api/v1/products/:id`
- **Method:** DELETE | **URL:** `/api/v1/products/:id` | **Permission:** `PRODUCTS:delete`

#### `GET /api/v1/categories`
- **Method:** GET | **URL:** `/api/v1/categories` | **Permission:** `CATEGORIES:read`

#### `POST /api/v1/categories`
- **Method:** POST | **URL:** `/api/v1/categories` | **Permission:** `CATEGORIES:create`

#### `GET /api/v1/brands`
- **Method:** GET | **URL:** `/api/v1/brands` | **Permission:** `BRANDS:read`

#### `POST /api/v1/brands`
- **Method:** POST | **URL:** `/api/v1/brands` | **Permission:** `BRANDS:create`

#### `GET /api/v1/attributes`
- **Method:** GET | **URL:** `/api/v1/attributes` | **Permission:** `PRODUCTS:read`

---

### 2.4 INVENTORY MANAGEMENT (`/api/v1/inventory`)

#### `GET /api/v1/inventory`
- **Method:** GET
- **URL:** `/api/v1/inventory`
- **Authentication:** Bearer Admin JWT
- **Permission:** `INVENTORY:read`
- **Query Parameters:** `page`, `limit`, `warehouseId`, `search`
- **Response Structure:** Stock items table with `quantityAvailable`, `quantityReserved`.

#### `GET /api/v1/inventory/low-stock`
- **Method:** GET | **URL:** `/api/v1/inventory/low-stock` | **Permission:** `INVENTORY:read`

#### `GET /api/v1/inventory/out-of-stock`
- **Method:** GET | **URL:** `/api/v1/inventory/out-of-stock` | **Permission:** `INVENTORY:read`

#### `GET /api/v1/inventory/value`
- **Method:** GET | **URL:** `/api/v1/inventory/value` | **Permission:** `INVENTORY:read`
- **Response Structure:** Total financial valuation of inventory.

#### `PUT /api/v1/inventory/:id`
- **Method:** PUT
- **URL:** `/api/v1/inventory/:id`
- **Authentication:** Bearer Admin JWT
- **Permission:** `INVENTORY:update`
- **Request Body:** `{ "quantityTotal": 150, "reorderPoint": 20 }`

---

### 2.5 ORDER MANAGEMENT (`/api/v1/orders`)

#### `GET /api/v1/orders`
- **Method:** GET
- **URL:** `/api/v1/orders`
- **Authentication:** Bearer Admin JWT
- **Permission:** `ORDERS:read`
- **Query Parameters:** `page`, `limit`, `status`, `paymentStatus`, `search`, `startDate`, `endDate`
- **Response Structure:** Order ledger with customer names, status badges, totals.

#### `GET /api/v1/orders/:id`
- **Method:** GET | **URL:** `/api/v1/orders/:id` | **Permission:** `ORDERS:read`

#### `PUT /api/v1/orders/:id/status`
- **Method:** PUT
- **URL:** `/api/v1/orders/:id/status`
- **Authentication:** Bearer Admin JWT
- **Permission:** `ORDERS:write`
- **Request Body:** `{ "status": "PROCESSING", "note": "Order verified by staff" }`

#### `PATCH /api/v1/orders/:id/assign`
- **Method:** PATCH | **URL:** `/api/v1/orders/:id/assign` | **Permission:** `ORDERS:write`
- **Request Body:** `{ "staffId": "string" }`

#### `POST /api/v1/orders/:id/notes`
- **Method:** POST | **URL:** `/api/v1/orders/:id/notes` | **Permission:** `ORDERS:write`
- **Request Body:** `{ "content": "Customer requested delivery after 5 PM" }`

---

### 2.6 PAYMENTS & REFUNDS (`/api/v1/payments`, `/api/v1/refunds`)

#### `GET /api/v1/payments`
- **Method:** GET | **URL:** `/api/v1/payments` | **Permission:** `PAYMENTS:read`

#### `GET /api/v1/payments/:id`
- **Method:** GET | **URL:** `/api/v1/payments/:id` | **Permission:** `PAYMENTS:read`

#### `PUT /api/v1/payments/:id`
- **Method:** PUT | **URL:** `/api/v1/payments/:id` | **Permission:** `PAYMENTS:write`
- **Request Body:** `{ "status": "PAID", "transactionReference": "TRX-998877" }`

#### `GET /api/v1/refunds`
- **Method:** GET | **URL:** `/api/v1/refunds` | **Permission:** `REFUNDS:read`

#### `POST /api/v1/refunds`
- **Method:** POST
- **URL:** `/api/v1/refunds`
- **Authentication:** Bearer Admin JWT
- **Permission:** `REFUNDS:write`
- **Request Body:** `{ "orderId": "string", "paymentId": "string", "amount": 50.00, "reason": "Damaged goods" }`

#### `POST /api/v1/refunds/:id/process`
- **Method:** POST | **URL:** `/api/v1/refunds/:id/process` | **Permission:** `REFUNDS:write`
- **Request Body:** `{ "approve": true, "providerReference": "REF-BKASH-001" }`

---

### 2.7 SHIPMENTS & RETURNS (`/api/v1/shipments`, `/api/v1/returns`)

#### `GET /api/v1/shipments`
- **Method:** GET | **URL:** `/api/v1/shipments` | **Permission:** `ORDERS:read`

#### `POST /api/v1/shipments`
- **Method:** POST
- **URL:** `/api/v1/shipments`
- **Authentication:** Bearer Admin JWT
- **Permission:** `ORDERS:write`
- **Request Body:** `{ "orderId": "string", "courierId": "string", "trackingNumber": "TRK-123", "items": [{ "orderItemId": "string", "quantity": 1 }] }`

#### `PUT /api/v1/shipments/:id/status`
- **Method:** PUT | **URL:** `/api/v1/shipments/:id/status` | **Permission:** `ORDERS:write`
- **Request Body:** `{ "status": "IN_TRANSIT" }`

#### `GET /api/v1/returns`
- **Method:** GET | **URL:** `/api/v1/returns` | **Permission:** `ORDERS:read`

#### `POST /api/v1/returns/:id/approve`
- **Method:** POST | **URL:** `/api/v1/returns/:id/approve` | **Permission:** `ORDERS:write`

#### `POST /api/v1/returns/:id/receive`
- **Method:** POST
- **URL:** `/api/v1/returns/:id/receive`
- **Authentication:** Bearer Admin JWT
- **Permission:** `ORDERS:write`
- **Notes:** Automatically restocks returned item quantity into `Inventory.quantityAvailable` inside transaction.

---

### 2.8 CUSTOMERS MANAGEMENT (`/api/v1/customers`)

#### `GET /api/v1/customers`
- **Method:** GET | **URL:** `/api/v1/customers` | **Permission:** `CUSTOMERS:read`

#### `GET /api/v1/customers/:id`
- **Method:** GET | **URL:** `/api/v1/customers/:id` | **Permission:** `CUSTOMERS:read`

#### `PATCH /api/v1/customers/:id/status`
- **Method:** PATCH | **URL:** `/api/v1/customers/:id/status` | **Permission:** `CUSTOMERS:write`
- **Request Body:** `{ "isActive": false }`

---

### 2.9 SYSTEM SETTINGS & MEDIA (`/api/v1/settings`, `/api/v1/media`, `/api/v1/audit-logs`)

#### `GET /api/v1/settings/:group`
- **Method:** GET | **URL:** `/api/v1/settings/:group` (`general`, `branding`, `seo`, `smtp`, `analytics`, `security`, `shipping`, `tax`) | **Permission:** `SETTINGS:read`

#### `PUT /api/v1/settings/:group`
- **Method:** PUT | **URL:** `/api/v1/settings/:group` | **Permission:** `SETTINGS:write`

#### `POST /api/v1/media/upload`
- **Method:** POST | **URL:** `/api/v1/media/upload` | **Permission:** `MEDIA:upload` | **Content-Type:** `multipart/form-data`

#### `GET /api/v1/audit-logs`
- **Method:** GET | **URL:** `/api/v1/audit-logs` | **Permission:** `AUDIT_LOGS:read`

---

## 3. STOREFRONT API ENDPOINTS (`/api/storefront/v1`)

### 3.1 CUSTOMER AUTHENTICATION (`/api/storefront/v1/auth`)

#### `POST /api/storefront/v1/auth/register`
- **Method:** POST
- **URL:** `/api/storefront/v1/auth/register`
- **Authentication:** None
- **Request Body:** `{ "email": "user@example.com", "password": "Password123!", "firstName": "John", "lastName": "Doe" }`
- **Response Structure:** `{ "success": true, "data": { "customer": {}, "token": "string" } }`

#### `POST /api/storefront/v1/auth/login`
- **Method:** POST
- **URL:** `/api/storefront/v1/auth/login`
- **Authentication:** None
- **Request Body:** `{ "email": "user@example.com", "password": "Password123!" }`

#### `GET /api/storefront/v1/auth/me`
- **Method:** GET | **URL:** `/api/storefront/v1/auth/me` | **Authentication:** Bearer Customer JWT

---

### 3.2 PUBLIC CATALOG & SEARCH (`/api/storefront/v1/products`, `/api/storefront/v1/search`)

#### `GET /api/storefront/v1/products`
- **Method:** GET
- **URL:** `/api/storefront/v1/products`
- **Authentication:** None
- **Query Parameters:** `page`, `limit`, `category`, `brand`, `minPrice`, `maxPrice`, `sort`
- **Response Structure:** Storefront DTO list (`StorefrontProductDTO`).

#### `GET /api/storefront/v1/products/:slug`
- **Method:** GET | **URL:** `/api/storefront/v1/products/:slug` | **Authentication:** None

#### `GET /api/storefront/v1/search`
- **Method:** GET
- **URL:** `/api/storefront/v1/search`
- **Authentication:** None
- **Query Parameters:** `q` (search string), `category`, `brand`, `minPrice`, `maxPrice`
- **Response Structure:** Search result array + facet aggregation buckets.

---

### 3.3 CART & CHECKOUT ENGINE (`/api/storefront/v1/cart`, `/api/storefront/v1/checkout`)

#### `GET /api/storefront/v1/cart`
- **Method:** GET | **URL:** `/api/storefront/v1/cart` | **Authentication:** Optional Customer JWT / Session ID

#### `POST /api/storefront/v1/cart/items`
- **Method:** POST
- **URL:** `/api/storefront/v1/cart/items`
- **Request Body:** `{ "productId": "string", "variantId": "string", "quantity": 1 }`

#### `PUT /api/storefront/v1/cart/items/:id`
- **Method:** PUT | **URL:** `/api/storefront/v1/cart/items/:id` | **Request Body:** `{ "quantity": 2 }`

#### `DELETE /api/storefront/v1/cart/items/:id`
- **Method:** DELETE | **URL:** `/api/storefront/v1/cart/items/:id`

#### `POST /api/storefront/v1/checkout/apply-coupon`
- **Method:** POST | **URL:** `/api/storefront/v1/checkout/apply-coupon` | **Request Body:** `{ "cartId": "string", "code": "SUMMER20" }`

#### `POST /api/storefront/v1/checkout/complete`
- **Method:** POST
- **URL:** `/api/storefront/v1/checkout/complete`
- **Authentication:** Bearer Customer JWT / Guest Session
- **Request Body:**
  ```json
  {
    "cartId": "string",
    "shippingAddress": { "addressLine1": "123 Main St", "city": "Dhaka", "country": "Bangladesh" },
    "paymentProvider": "COD"
  }
  ```
- **Response Structure:** Placed `StorefrontOrderDTO`.

---

### 3.4 CUSTOMER ORDERS & RETURNS (`/api/storefront/v1/orders`, `/api/storefront/v1/returns`, `/api/storefront/v1/refund`)

#### `GET /api/storefront/v1/orders`
- **Method:** GET | **URL:** `/api/storefront/v1/orders` | **Authentication:** Bearer Customer JWT

#### `GET /api/storefront/v1/orders/:id`
- **Method:** GET | **URL:** `/api/storefront/v1/orders/:id` | **Authentication:** Bearer Customer JWT

#### `POST /api/storefront/v1/refund/request`
- **Method:** POST | **URL:** `/api/storefront/v1/refund/request` | **Authentication:** Bearer Customer JWT
- **Request Body:** `{ "orderId": "string", "reason": "Order cancelled prior to dispatch" }`

#### `POST /api/storefront/v1/returns/request`
- **Method:** POST | **URL:** `/api/storefront/v1/returns/request` | **Authentication:** Bearer Customer JWT
- **Request Body:** `{ "orderId": "string", "items": [{ "orderItemId": "string", "quantity": 1 }], "reason": "Wrong size received" }`

---

### 3.5 CONTENT, CMS & MERCHANT (`/api/storefront/v1/merchant`, `/api/storefront/v1/pages`, `/api/storefront/v1/seo`)

#### `GET /api/storefront/v1/merchant/info`
- **Method:** GET | **URL:** `/api/storefront/v1/merchant/info` | **Authentication:** None

#### `GET /api/storefront/v1/pages/:slug`
- **Method:** GET | **URL:** `/api/storefront/v1/pages/:slug` | **Authentication:** None

#### `GET /api/storefront/v1/seo/global`
- **Method:** GET | **URL:** `/api/storefront/v1/seo/global` | **Authentication:** None

---

*End of REST API Contract & Interface Specification.*
