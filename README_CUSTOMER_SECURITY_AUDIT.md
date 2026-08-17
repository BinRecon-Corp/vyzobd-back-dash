# Customer Security Audit

## 1. IDOR Vulnerabilities
**Status:** MITIGATED. 
- Controllers consistently enforce filtering by `customerId: req.customer.id` alongside resource IDs (e.g., `ReturnRequest.findUnique({ where: { id, customerId }})`). 
- Validates the active user owns the data prior to providing read or write privileges on Addresses, Returns, Orders, and Notifications.

## 2. Broken Access Control & Data Leakage
**Status:** MITIGATED. 
- Order History mapping specifically implements `mapOrderToStorefrontDTO` safely removing `internalNotes`, `supplierCost`, and administrative properties.
- Return APIs strip `adminNotes` by leveraging the `mapReturnRequestToStorefrontDTO` abstraction.

## 3. JWT Validation & Replay
**Status:** MITIGATED. 
- Short-lived Access Tokens (default 1h) bound exclusively to `access` types prevent refresh tokens from being weaponized.
- Validates signatures and strictly checks `isActive` and `deletedAt` at the middleware layer. 
- Expired/Invalid attempts trigger a `console.warn` and Activity Logging for traceability (`[SECURITY] Invalid customer JWT Token attempt...`).

## 4. Token Revocation
**Status:** MITIGATED.
- On standard Logouts or core security events (Password Changes, Reset Password flows), refresh sessions are aggressively deleted physically from `CustomerSession` and hard flagged via `revokedAt = new Date()` inside `CustomerRefreshToken`.
- This ensures forced global disconnects upon compromised password updates.

## 5. Brute Force Protection
**Status:** MITIGATED.
- The `loginLimiter` effectively caps attempts targeting `/api/v1/customer/auth/login`.
