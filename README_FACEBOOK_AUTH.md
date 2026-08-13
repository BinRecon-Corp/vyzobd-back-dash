# Facebook OAuth Authentication

The Facebook OAuth Authentication module provides enterprise-grade, secure "Login with Facebook" capabilities for the customer storefront.

## Implemented API Endpoint

### Facebook Auth
**Endpoint**: `POST /api/v1/customer/auth/facebook`
**Description**: Authenticates or registers a customer securely using a Facebook Access Token.

**Security & Flow**:
- **Token Verification**: Uses native Node.js `fetch` to directly query Facebook's official Graph API (`https://graph.facebook.com/me`) with the provided `accessToken`. This securely validates the token and requests scoped profile metadata (`id`, `first_name`, `last_name`, `email`, `picture`).
- **Customer Resolution**: 
  - Validates the presence of an email address inside the Graph API payload.
  - Searches for an existing customer by the verified `email`.
  - **If Exists**: Automatically updates the `provider` to `FACEBOOK`, syncs their `avatarUrl`, maps `providerId` to the Facebook Graph ID (`id`), and registers their `lastLoginAt`.
  - **If New**: Creates a fresh customer record mirroring their Facebook Profile data.
- **Session Issuance**: Generates a standard dual JWT (Access Token and long-lived Refresh Token) identical to standard local authentication mechanisms.
- **Traceability**: Securely logs the new session inside both `CustomerRefreshToken` and `CustomerSession` tables using the exact same footprint tracking (IP Address, User-Agent) established by the core authentication engine.

## Implementation Details

1. Native `fetch` is utilized to request Facebook metadata, avoiding external dependency bloat.
2. The `customer-auth.controller.ts` handles Facebook profile resolution securely.
3. Fully integrated into the primary `/api/v1/customer/auth` router space for domain consistency.
