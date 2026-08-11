# STOREFRONT CUSTOMER API REFERENCE & INTEGRATION GUIDE

**Base URL:** `/api/storefront/v1`  
**Authentication:** HTTP Bearer Token (`Authorization: Bearer <CustomerJWT>`)  
**Content-Type:** `application/json`  

---

## 1. AUTHENTICATION (`/api/storefront/v1/auth`)

### 1.1 Customer Registration
Registers a new customer account.

- **Method:** `POST`
- **Path:** `/api/storefront/v1/auth/register`
- **Auth Required:** No

#### Request Example
```json
{
  "email": "customer@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+8801700000000"
}
```

#### Response Example (`201 Created`)
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "customer": {
      "id": "c39a82b1-5e88-4f11-a832-8c42289f0a01",
      "email": "customer@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+8801700000000",
      "isVerified": false,
      "createdAt": "2026-08-10T18:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "7f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c"
  }
}
```

---

### 1.2 Customer Login
Authenticates customer credentials and issues session JWT tokens.

- **Method:** `POST`
- **Path:** `/api/storefront/v1/auth/login`
- **Auth Required:** No

#### Request Example
```json
{
  "email": "customer@example.com",
  "password": "SecurePassword123!"
}
```

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "customer": {
      "id": "c39a82b1-5e88-4f11-a832-8c42289f0a01",
      "email": "customer@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "7f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c"
  }
}
```

---

### 1.3 Refresh Auth Token
Refreshes an expired access token using a valid refresh token.

- **Method:** `POST`
- **Path:** `/api/storefront/v1/auth/refresh`
- **Auth Required:** No

#### Request Example
```json
{
  "refreshToken": "7f9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c"
}
```

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new_token_payload...",
    "refreshToken": "8a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d"
  }
}
```

---

### 1.4 Customer Logout
Revokes customer refresh token session.

- **Method:** `POST`
- **Path:** `/api/storefront/v1/auth/logout`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Request Example
```json
{
  "refreshToken": "8a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d"
}
```

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 2. PROFILE (`/api/storefront/v1/account`)

### 2.1 Get Account Profile
Fetches current customer account details and statistics.

- **Method:** `GET`
- **Path:** `/api/storefront/v1/account/me`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Request Example
`GET /api/storefront/v1/account/me`

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "c39a82b1-5e88-4f11-a832-8c42289f0a01",
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+8801700000000",
    "rewardPoints": 150,
    "balance": "0.00",
    "createdAt": "2026-08-10T18:00:00.000Z"
  }
}
```

---

### 2.2 Update Profile Info
Updates basic profile metadata (first name, last name, phone).

- **Method:** `PUT`
- **Path:** `/api/storefront/v1/account/me`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Request Example
```json
{
  "firstName": "Johnathan",
  "lastName": "Doe",
  "phone": "+8801711112222"
}
```

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "c39a82b1-5e88-4f11-a832-8c42289f0a01",
    "firstName": "Johnathan",
    "lastName": "Doe",
    "phone": "+8801711112222"
  }
}
```

---

### 2.3 Change Password
Updates customer password after validating current password.

- **Method:** `PUT`
- **Path:** `/api/storefront/v1/account/password`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Request Example
```json
{
  "currentPassword": "SecurePassword123!",
  "newPassword": "BrandNewPassword456!"
}
```

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 3. ADDRESS (`/api/storefront/v1/account/addresses`)

### 3.1 List Customer Addresses
Retrieves all saved shipping and billing addresses for the customer.

- **Method:** `GET`
- **Path:** `/api/storefront/v1/account/addresses`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "a123b456-789c-012d-345e-678f901a234b",
      "type": "SHIPPING",
      "addressLine1": "House 42, Road 11, Banani",
      "addressLine2": "Apartment 4B",
      "city": "Dhaka",
      "state": "Dhaka",
      "postalCode": "1213",
      "country": "Bangladesh",
      "isDefault": true
    }
  ]
}
```

---

### 3.2 Add New Address
Creates a new shipping or billing address.

- **Method:** `POST`
- **Path:** `/api/storefront/v1/account/addresses`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Request Example
```json
{
  "type": "SHIPPING",
  "addressLine1": "Plot 15, Sector 3, Uttara",
  "addressLine2": "",
  "city": "Dhaka",
  "state": "Dhaka",
  "postalCode": "1230",
  "country": "Bangladesh",
  "isDefault": false
}
```

#### Response Example (`201 Created`)
```json
{
  "success": true,
  "message": "Address added successfully",
  "data": {
    "id": "b987c654-321a-098f-765e-432d109c876a",
    "type": "SHIPPING",
    "addressLine1": "Plot 15, Sector 3, Uttara",
    "city": "Dhaka",
    "isDefault": false
  }
}
```

---

### 3.3 Delete Address
Deletes a saved address by ID.

- **Method:** `DELETE`
- **Path:** `/api/storefront/v1/account/addresses/:id`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

---

## 4. WISHLIST (`/api/storefront/v1/wishlist`)

### 4.1 Get Wishlist
Fetches customer's saved favorite items.

- **Method:** `GET`
- **Path:** `/api/storefront/v1/wishlist`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "w1112223-3334-4445-5556-666777888999",
    "items": [
      {
        "id": "wi123456-7890-1234-5678-901234567890",
        "productId": "p9998887-7766-5544-3322-110099887766",
        "product": {
          "name": "Minimalist Wireless Earbuds",
          "slug": "minimalist-wireless-earbuds",
          "basePrice": "89.99",
          "primaryImage": "https://res.cloudinary.com/demo/image/upload/v1/earbuds.jpg"
        },
        "addedAt": "2026-08-10T18:10:00.000Z"
      }
    ]
  }
}
```

---

### 4.2 Add Product to Wishlist
Saves a product to the customer's wishlist.

- **Method:** `POST`
- **Path:** `/api/storefront/v1/wishlist/:productId`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "message": "Item added to wishlist"
}
```

---

### 4.3 Remove Product from Wishlist
Removes a product from the wishlist.

- **Method:** `DELETE`
- **Path:** `/api/storefront/v1/wishlist/:productId`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "message": "Item removed from wishlist"
}
```

---

## 5. CART (`/api/storefront/v1/cart`)

### 5.1 Get Cart
Retrieves current shopping cart session with subtotals and discounts.

- **Method:** `GET`
- **Path:** `/api/storefront/v1/cart`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "cart-88877766-5544-3322-1100-998877665544",
    "subtotal": "179.98",
    "discountAmount": "0.00",
    "totalAmount": "179.98",
    "items": [
      {
        "id": "item-111",
        "productId": "p9998887-7766-5544-3322-110099887766",
        "variantId": "v1112223-3334-4445-5556-666777888999",
        "quantity": 2,
        "unitPrice": "89.99",
        "totalPrice": "179.98",
        "productName": "Minimalist Wireless Earbuds",
        "sku": "EARBUDS-BLK"
      }
    ]
  }
}
```

---

### 5.2 Add Item to Cart
Adds a product variant to the cart.

- **Method:** `POST`
- **Path:** `/api/storefront/v1/cart/items`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Request Example
```json
{
  "productId": "p9998887-7766-5544-3322-110099887766",
  "variantId": "v1112223-3334-4445-5556-666777888999",
  "quantity": 1
}
```

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "cartId": "cart-88877766-5544-3322-1100-998877665544",
    "totalAmount": "269.97"
  }
}
```

---

### 5.3 Update Cart Item Quantity
Updates line item quantity in cart.

- **Method:** `PUT`
- **Path:** `/api/storefront/v1/cart/items/:id`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Request Example
```json
{
  "quantity": 3
}
```

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "message": "Cart item updated"
}
```

---

### 5.4 Remove Cart Item
Removes a line item from the cart.

- **Method:** `DELETE`
- **Path:** `/api/storefront/v1/cart/items/:id`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

---

## 6. CHECKOUT (`/api/storefront/v1/checkout`)

### 6.1 Get Checkout Session Summary
Retrieves active session checkout calculations (subtotal, shipping, tax, discounts, final total).

- **Method:** `GET`
- **Path:** `/api/storefront/v1/checkout/session`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "data": {
    "cartId": "cart-88877766-5544-3322-1100-998877665544",
    "subtotal": "179.98",
    "discountAmount": "20.00",
    "shippingAmount": "10.00",
    "taxAmount": "17.00",
    "totalAmount": "186.98",
    "appliedCoupon": {
      "code": "PROMO20",
      "discountValue": "20.00"
    }
  }
}
```

---

### 6.2 Apply Promotional Coupon
Applies a valid coupon code to the checkout session.

- **Method:** `POST`
- **Path:** `/api/storefront/v1/checkout/coupon`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Request Example
```json
{
  "code": "PROMO20"
}
```

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "message": "Coupon applied successfully",
  "data": {
    "discountAmount": "20.00",
    "newTotal": "186.98"
  }
}
```

---

### 6.3 Complete Checkout & Place Order
Executes atomic checkout transaction, verifies inventory reservation, creates purchase order, clears active cart.

- **Method:** `POST`
- **Path:** `/api/storefront/v1/checkout/complete`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Request Example
```json
{
  "cartId": "cart-88877766-5544-3322-1100-998877665544",
  "shippingAddressId": "a123b456-789c-012d-345e-678f901a234b",
  "paymentProvider": "COD",
  "customerNotes": "Please call before delivery"
}
```

#### Response Example (`201 Created`)
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "orderId": "ord-99001122-3344-5566-7788-990011223344",
    "orderNumber": "ORD-20260810-0042",
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "totalAmount": "186.98",
    "currency": "BDT",
    "createdAt": "2026-08-10T18:15:00.000Z"
  }
}
```

---

## 7. ORDERS (`/api/storefront/v1/orders`)

### 7.1 List My Orders
Retrieves historical purchase orders for logged-in customer.

- **Method:** `GET`
- **Path:** `/api/storefront/v1/orders`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "ord-99001122-3344-5566-7788-990011223344",
      "orderNumber": "ORD-20260810-0042",
      "status": "PROCESSING",
      "paymentStatus": "PAID",
      "totalAmount": "186.98",
      "itemCount": 2,
      "createdAt": "2026-08-10T18:15:00.000Z"
    }
  ]
}
```

---

### 7.2 Get Order Details
Retrieves detailed breakdown of an order including line items, prices, shipping address, and timeline.

- **Method:** `GET`
- **Path:** `/api/storefront/v1/orders/:id`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "ord-99001122-3344-5566-7788-990011223344",
    "orderNumber": "ORD-20260810-0042",
    "status": "PROCESSING",
    "paymentStatus": "PAID",
    "subtotal": "179.98",
    "discountAmount": "20.00",
    "taxAmount": "17.00",
    "shippingAmount": "10.00",
    "totalAmount": "186.98",
    "items": [
      {
        "id": "item-001",
        "productName": "Minimalist Wireless Earbuds",
        "sku": "EARBUDS-BLK",
        "quantity": 2,
        "unitPrice": "89.99",
        "totalPrice": "179.98"
      }
    ],
    "timeline": [
      { "status": "PENDING", "action": "ORDER_CREATED", "timestamp": "2026-08-10T18:15:00.000Z" },
      { "status": "PROCESSING", "action": "PAYMENT_RECEIVED", "timestamp": "2026-08-10T18:16:00.000Z" }
    ]
  }
}
```

---

## 8. PAYMENTS (`/api/storefront/v1/payment`)

### 8.1 Initiate Payment
Initiates online payment gateway checkout session (bKash, SSLCommerz, Stripe).

- **Method:** `POST`
- **Path:** `/api/storefront/v1/payment/initiate`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Request Example
```json
{
  "orderId": "ord-99001122-3344-5566-7788-990011223344",
  "provider": "BKASH"
}
```

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "data": {
    "paymentId": "pay-55443322-1100-9988-7766-554433221100",
    "redirectUrl": "https://checkout.bkash.com/pay/session_token_xyz123",
    "status": "PENDING"
  }
}
```

---

### 8.2 Verify Payment Settlement
Validates payment result callback from gateway.

- **Method:** `POST`
- **Path:** `/api/storefront/v1/payment/verify`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Request Example
```json
{
  "paymentId": "pay-55443322-1100-9988-7766-554433221100",
  "transactionReference": "TRX-BKASH-887766"
}
```

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "message": "Payment verified and order updated",
  "data": {
    "status": "PAID",
    "orderStatus": "PROCESSING"
  }
}
```

---

## 9. RETURNS (`/api/storefront/v1/returns`)

### 9.1 Request Item Return
Submits a customer request to return eligible items from a delivered order.

- **Method:** `POST`
- **Path:** `/api/storefront/v1/returns/request`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Request Example
```json
{
  "orderId": "ord-99001122-3344-5566-7788-990011223344",
  "reason": "Defective item received",
  "items": [
    {
      "orderItemId": "item-001",
      "quantity": 1
    }
  ]
}
```

#### Response Example (`201 Created`)
```json
{
  "success": true,
  "message": "Return request submitted",
  "data": {
    "returnRequestId": "ret-12345678-90ab-cdef-1234-567890abcdef",
    "status": "REQUESTED",
    "createdAt": "2026-08-10T18:20:00.000Z"
  }
}
```

---

### 9.2 List My Return Requests
Lists customer return applications and status stages.

- **Method:** `GET`
- **Path:** `/api/storefront/v1/returns`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "ret-12345678-90ab-cdef-1234-567890abcdef",
      "orderId": "ord-99001122-3344-5566-7788-990011223344",
      "status": "APPROVED",
      "refundAmount": "89.99",
      "createdAt": "2026-08-10T18:20:00.000Z"
    }
  ]
}
```

---

## 10. REFUNDS (`/api/storefront/v1/refund`)

### 10.1 Request Order Refund
Requests full or partial refund for an order prior to shipment or following cancellation.

- **Method:** `POST`
- **Path:** `/api/storefront/v1/refund/request`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Request Example
```json
{
  "orderId": "ord-99001122-3344-5566-7788-990011223344",
  "reason": "Accidental order placement"
}
```

#### Response Example (`201 Created`)
```json
{
  "success": true,
  "message": "Refund request submitted for staff review",
  "data": {
    "refundId": "ref-99887766-5544-3322-1100-998877665544",
    "status": "PENDING",
    "amount": "186.98"
  }
}
```

---

### 10.2 List My Refund Requests
Retrieves history of customer refund requests and processing results.

- **Method:** `GET`
- **Path:** `/api/storefront/v1/refund`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "ref-99887766-5544-3322-1100-998877665544",
      "orderId": "ord-99001122-3344-5566-7788-990011223344",
      "status": "COMPLETED",
      "amount": "186.98",
      "completedAt": "2026-08-10T18:21:00.000Z"
    }
  ]
}
```

---

## 11. NOTIFICATIONS (`/api/storefront/v1/notifications`)

### 11.1 Get Customer Notifications
Fetches customer in-app notifications.

- **Method:** `GET`
- **Path:** `/api/storefront/v1/notifications`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-00112233-4455-6677-8899-001122334455",
      "type": "ORDER_SHIPPED",
      "title": "Your order has been shipped!",
      "message": "Order ORD-20260810-0042 is on its way via Steadfast Courier.",
      "status": "SENT",
      "createdAt": "2026-08-10T18:18:00.000Z"
    }
  ]
}
```

---

### 11.2 Get Unread Notification Count
Returns unread message count for badge counters.

- **Method:** `GET`
- **Path:** `/api/storefront/v1/notifications/unread-count`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "data": {
    "unreadCount": 3
  }
}
```

---

### 11.3 Mark Single Notification as Read
Marks a specific notification as read.

- **Method:** `POST`
- **Path:** `/api/storefront/v1/notifications/:id/read`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### 11.4 Mark All Notifications as Read
Batch marks all customer notifications as read.

- **Method:** `POST`
- **Path:** `/api/storefront/v1/notifications/read-all`
- **Auth Required:** Yes (`Bearer <Token>`)

#### Response Example (`200 OK`)
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

*End of Storefront Customer API Reference & Integration Guide.*
