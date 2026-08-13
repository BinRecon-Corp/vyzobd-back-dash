# PHASE 7 SCORECARD - Customer Features Audit

## Customer Auth
**Score: PASS**
- Re-verified Registration, Login, Logout using both Local and OAuth strategies.
- Added Email Verification token generation and verification logic (`verifyEmail`).
- Added Forgot Password (`forgotPassword`) and Reset Password (`resetPassword`) features securely matching tokens to the user.
- Addressed tokens with strict `zod` validation and DB constraints.

## Customer Profile
**Score: PASS**
- Created standard endpoints for updating `firstName`, `lastName`, `phone`, and `avatarUrl`.
- Integrated `NotificationPreference` models and created `getPreferences` / `updatePreferences` APIs for opt-ins.
- Change password logic is verified and safely clears sessions.

## Address Book
**Score: PASS**
- Implemented robust `createAddress`, `updateAddress`, `deleteAddress`, and `getAddresses`.
- Enforces strict one default address rule using cross-updating in Prisma transactions.
- Ownership protection safely guards `req.customer.id`.

## Order History
**Score: PASS**
- Provided via `src/backend/controllers/storefront/order.controller.ts`.
- Prevents cross-customer leakage.
- Safely mapped via `mapOrderToStorefrontDTO` to prevent `internalNotes`, `supplierCost`, and other sensitive backend fields from leaking to customers.

## Returns
**Score: PASS**
- Verified returns API properly applies to `Delivered` status orders only.
- Validation checks available quantities accurately before accepting RMA requests.
- Returns are mapped through DTO to strip `adminNotes`.

## Wishlist
**Score: PASS**
- Standardized `addToWishlist`, `removeFromWishlist`, and `getWishlist`.
- Pre-checks product active status and handles duplication natively via `findUnique`.

## Notifications
**Score: PASS**
- Uses `StorefrontNotificationService` to list notifications matching `IN_APP` and `customerId`.
- Allows `markAsRead` and `markAllAsRead` correctly scoping to the customer context.

## Activity Logs
**Score: PASS**
- Captures actions safely to `CustomerActivity` and exposes via pagination.
- Verifies IP address / User-Agent capturing during Auth events.

## Storefront Readiness
**Score: PASS**
- Clean separations between internal `apiRouter` and standard `/storefront` routes.
- Robust, standardized pagination and DTO mapping exist.
- AuthGuards uniformly used on all private user spaces.

## Database Readiness
**Score: PASS**
- Prisma ORM physically syncs models `Customer`, `CustomerRefreshToken`, `CustomerAddress`, `Wishlist`, `ReturnRequest`, and `Notification`.
