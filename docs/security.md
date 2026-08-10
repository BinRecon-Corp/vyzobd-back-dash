# Security Architecture & Hardening Guide

## 1. Authentication & JWT Architecture
The platform enforces isolated dual JWT token authentication streams:
1. **Admin / Back-Office JWT**:
   - Issued via `POST /api/v1/auth/login`.
   - Access token sent in `Authorization: Bearer <token>` header.
   - Refresh token rotated and stored in DB (`RefreshToken` table) and signed HTTP-only cookie.
2. **Customer Storefront JWT**:
   - Issued via `POST /api/storefront/v1/auth/login`.
   - Signed with customer-specific secret, tracked in `CustomerRefreshToken` table.

## 2. Role-Based Access Control (RBAC)
Permissions are checked dynamically using the `requirePermission` middleware:
```typescript
// Example: src/backend/routes/product.routes.ts
router.post("/", requireAuth, requirePermission("products:create"), createProduct);
```
Super Admin role bypasses granular permission checks.

## 3. Rate Limiting & Protection Rules
Rate limiters configured using `express-rate-limit`:
- **Global API Rate Limiter**: 100 requests per minute per IP.
- **Auth Endpoint Rate Limiter**: 10 login attempts per 15 minutes per IP.
- **Checkout Rate Limiter**: 5 requests per minute per customer to prevent checkout spam.

## 4. Input Sanitization & Helmet
- **XSS Prevention**: Custom recursive sanitization middleware strips HTML tags and executable scripts from incoming `req.body`, `req.query`, and `req.params`.
- **Helmet Headers**: Configured with strict Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), X-Content-Type-Options: nosniff, and X-Frame-Options.
