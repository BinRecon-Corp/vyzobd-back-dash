# Customer Local Authentication

The Customer Local Authentication module handles enterprise-grade secure login, registration, and logout operations specifically designed for storefront consumers. It uses robust hashing and dual JWT tokens (Access + Refresh).

## Implemented API Endpoints

All endpoints are mounted under `/api/v1/customer/auth` to distinctly separate them from existing generic storefront APIs and administrative endpoints.

### 1. Register
**Endpoint**: `POST /api/v1/customer/auth/register`
**Description**: Registers a new customer using a local `Email / Password` strategy.
**Security Features**:
- Explicit validation of input using `zod`.
- Hashes the password utilizing `bcryptjs` with a cost factor of 12.
- Protects against duplicate emails and phone numbers.
- Pre-sets `emailVerified` to `false` and sets provider to `LOCAL`.

### 2. Login
**Endpoint**: `POST /api/v1/customer/auth/login`
**Description**: Authenticates a customer using their credentials.
**Security Features**:
- Applies a rate limiter (`loginLimiter`) to mitigate brute-force attempts.
- Verifies the user's password hash against the stored database value.
- Generates a short-lived **Access Token** and a long-lived **Refresh Token**.
- Tracks the session inside both `CustomerRefreshToken` and the new `CustomerSession` models, capturing the client IP Address and User-Agent for strict session traceability.

### 3. Logout
**Endpoint**: `POST /api/v1/customer/auth/logout`
**Description**: Invalidates the active session securely.
**Security Features**:
- Requires a valid `Authorization` header with the active Customer JWT (`requireCustomerAuth`).
- Takes the active `refreshToken` and hashes it (SHA-256) to look up the DB entry.
- Hard deletes the session from `CustomerSession`.
- Flags the token as securely revoked inside the `CustomerRefreshToken` model.

## File Structure

The implementation includes the following new files:
- `src/backend/validators/customer-auth.validator.ts`: Schema validation for registration and login payloads.
- `src/backend/controllers/customer-auth.controller.ts`: Core logic handling the bcrypt operations, database interactions, duplicate checks, and JWT generation.
- `src/backend/routes/customer-auth.routes.ts`: Maps endpoints securely and applies necessary rate limiters and auth guards.

*Note: The primary entry point (`server.ts`) was correctly updated to mount these paths.*
