# Storefront Security Audit

## 1. IDOR Protection (Insecure Direct Object Reference)
**Status: PASS**
- `requireCustomerAuth` dynamically maps standard bearer JWT tokens onto `req.customer.id`.
- Services (`StorefrontOrderService`, `StorefrontCartService`, `StorefrontAddressService`, etc.) explicitly enforce `customerId: req.customer.id` on all database operations, ensuring no customer can query or mutate another customer's data via URL parameter manipulation.

## 2. JWT Security & Replay Prevention
**Status: PASS**
- Expiration limits properly configured for access tokens (short lifespan) vs. refresh tokens.
- Explicit checks for `tokenType === "access"` inside `requireCustomerAuth` prevent threat actors from utilizing leaked long-lived refresh tokens as Bearer credentials.
- IP logging dynamically flags authorization breaches and JWT spoofing into `ActivityLog`.

## 3. Server-Side Pricing Guard (Price Manipulation)
**Status: PASS**
- The Cart and Checkout APIs actively ignore price parameters provided by frontend JSON payloads. Instead, the `StorefrontCheckoutService.getCheckoutSession()` fetches physical product/variant keys and calculates the totals (`subtotal`, `tax`, `shipping`, `grandTotal`) securely on the backend server.

## 4. Mass Assignment
**Status: PASS**
- Addressed through strict input destructuring and Zod validation schemas (`validators/*.ts`). DTOs intercept database objects preventing admin escalation payloads.
