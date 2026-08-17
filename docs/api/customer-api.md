# Customer Portal API Reference

Base Path: `/api/storefront/v1`

Customer endpoints require authentication via Bearer token in the `Authorization` header or HTTP-only customer session cookies.

---

## 1. Authentication Endpoints

### POST `/auth/register`
Customer account registration.
- **Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "CustomerPassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

### POST `/auth/login`
Customer login.
- **Request Body**: `{ "email": "john.doe@example.com", "password": "CustomerPassword123!" }`

---

## 2. Cart & Checkout Endpoints

### GET `/cart`
Get current active customer cart.
- **Auth**: Required (`requireCustomerAuth`)

### POST `/cart/items`
Add item variant to cart.
- **Request Body**: `{ "variantId": "v1-uuid", "quantity": 2 }`

### POST `/checkout/session`
Create checkout session and reserve inventory.

### POST `/checkout/complete`
Finalize checkout and generate customer Order.
