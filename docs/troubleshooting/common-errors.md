# Troubleshooting Common Application Errors

This guide details common HTTP error codes, system exceptions, and resolution steps.

## 1. Authentication & Security Errors

### `401 Unauthorized: Invalid or Expired Token`
- **Cause**: Bearer token missing, signature validation failed, or token TTL expired.
- **Resolution**: Trigger token refresh (`POST /api/v1/auth/refresh-token` or `POST /api/storefront/v1/auth/refresh-token`). If refresh token is expired or revoked, redirect user to login.

### `403 Forbidden: Insufficient Permissions`
- **Cause**: Authenticated user's Role lacks required permission string for target endpoint.
- **Resolution**: Check user's assigned role in `User` table and inspect permissions in `RolePermission` matrix.

### `429 Too Many Requests: Rate Limit Exceeded`
- **Cause**: IP exceeded global or route-specific rate limit thresholds.
- **Resolution**: Lower client request frequency or adjust `max` window count in `src/backend/middlewares/rateLimiter.ts`.

---

## 2. Validation & Business Logic Errors

### `400 Bad Request: Validation Error`
- **Cause**: Request body failed Zod schema validation rules.
- **Resolution**: Inspect response `errors` array for specific field constraint violations.
