# Google OAuth Authentication

The Google OAuth Authentication module provides enterprise-grade, secure "Login with Google" capabilities for the customer storefront.

## Implemented API Endpoint

### Google Auth
**Endpoint**: `POST /api/v1/customer/auth/google`
**Description**: Authenticates or registers a customer securely using a Google ID token.

**Security & Flow**:
- **Token Verification**: Uses Google's official `google-auth-library` to securely verify the incoming `idToken` against the application's `GOOGLE_CLIENT_ID`.
- **Customer Resolution**: 
  - Searches for an existing customer by the verified `email`.
  - **If Exists**: Automatically updates the `provider` to `GOOGLE`, syncs their `avatarUrl`, maps `providerId` to the Google Subject ID (`sub`), and registers their `lastLoginAt`.
  - **If New**: Creates a fresh customer record mirroring their Google Profile data (`firstName`, `lastName`, `emailVerified`, etc.).
- **Session Issuance**: Generates a standard dual JWT (Access Token and long-lived Refresh Token) directly compatible with local authentication.
- **Traceability**: Securely logs the new session inside both `CustomerRefreshToken` and `CustomerSession` tables.

## Setup Requirements

For this to operate effectively in production, the environment must contain a valid Google Client ID to securely verify token audiences.
Ensure this variable is populated in the `.env` file:

```env
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
```

## Internal Implementations

1. `google-auth-library` dependency has been installed to manage secure OAuth interactions.
2. The `env.ts` config has been patched to type-check and parse `GOOGLE_CLIENT_ID`.
3. The `customer-auth.controller.ts` leverages a new `googleAuth` handler managing the complex upsert operations.
