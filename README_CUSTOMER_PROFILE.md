# Customer Profile & Address APIs

The Customer Profile and Address Management module provides secure, authenticated endpoints for customers to manage their account details, security credentials, and shipping/billing addresses on the storefront.

## Implemented API Endpoints

All endpoints are protected by the `requireCustomerAuth` middleware and mounted under `/api/v1/customer`.

### Profile Management

**1. Get Profile**
- **Endpoint**: `GET /api/v1/customer/profile`
- **Description**: Retrieves the authenticated customer's profile, safely omitting sensitive fields like the password hash.

**2. Update Profile**
- **Endpoint**: `PUT /api/v1/customer/profile`
- **Description**: Updates basic customer information (`firstName`, `lastName`, `phone`).
- **Validation**: Strict schema validation using `zod`.

**3. Change Password**
- **Endpoint**: `PUT /api/v1/customer/change-password`
- **Description**: Allows the customer to securely change their local authentication password.
- **Security Features**: 
  - Verifies `currentPassword` against the stored `bcrypt` hash.
  - Updates the hash utilizing a strong cost factor (12).
  - Automatically revokes all existing refresh tokens and active sessions to enforce a global logout across other devices for security.

### Address Management

**4. Get Addresses**
- **Endpoint**: `GET /api/v1/customer/addresses`
- **Description**: Retrieves all saved addresses for the authenticated customer, sorting default addresses first.

**5. Create Address**
- **Endpoint**: `POST /api/v1/customer/addresses`
- **Description**: Adds a new address book entry.
- **Logic**: If `isDefault` is true, automatically unsets any previous default address for the customer.

**6. Update Address**
- **Endpoint**: `PUT /api/v1/customer/addresses/:id`
- **Description**: Updates an existing address.
- **Security**: Ensures the address `id` strictly belongs to the authenticated customer before modifying. Manages default unsetting identically to creation.

**7. Delete Address**
- **Endpoint**: `DELETE /api/v1/customer/addresses/:id`
- **Description**: Hard-deletes a specific address.
- **Security**: Validates ownership before executing the delete operation.

## Architecture

1. **Validators**: Introduced `customer-profile.validator.ts` containing precise `zod` schemas for `updateProfileSchema`, `changePasswordSchema`, and `addressSchema`.
2. **Controllers**: `customer-profile.controller.ts` leverages Prisma to securely fetch and mutate data linked solely to the verified `req.customer.id`.
3. **Router**: Built an isolated `customer-profile.routes.ts` file mapped directly to the `/api/v1/customer` path in the application core (`server.ts`).
