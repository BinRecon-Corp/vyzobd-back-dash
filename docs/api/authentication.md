# Authentication & Token Architecture

The platform provides dual authentication streams for Admin Users and Storefront Customers.

## Admin Auth Workflow (`/api/v1/auth`)
1. Admin posts credentials to `POST /api/v1/auth/login`.
2. Server verifies email and Bcrypt password hash.
3. Server generates:
   - **Access Token**: Short-lived JWT (1 hour) carrying `id`, `email`, and `roleId`.
   - **Refresh Token**: Long-lived crypto token (7 days) saved in `RefreshToken` database table and set as HTTP-only secure cookie.
4. Token refresh request `POST /api/v1/auth/refresh-token` verifies cookie, rotates refresh token, and issues new access token.

## Storefront Auth Workflow (`/api/storefront/v1/auth`)
Operates identically using the `Customer` model and `CustomerRefreshToken` table.
