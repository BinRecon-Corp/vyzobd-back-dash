# Final Scorecard & Critical Issues

## Enterprise Readiness Scores
- RBAC Score: 75/100
- Backend API Score: 90/100
- Admin Integration Score: 85/100
- Storefront API Score: 60/100
- PostgreSQL Score: 70/100
- Prisma Score: 85/100
- Financial Safety Score: 65/100
- Performance Score: 50/100

**Overall Enterprise Readiness: 72.5%**

## Critical Issues Log

### 1. Storefront Order Data Leak
**Severity:** Critical
**File:** `/src/backend/services/storefront/order.service.ts`
**Root Cause:** `getCustomerOrderById` and `getCustomerOrders` return the entire `Order` record, exposing `internalNotes` and `assignedStaffId` directly to end-users via the public API.
**Fix:** Explicitly use `select` at the root level of the Prisma query to map only user-facing fields (e.g., `id`, `orderNumber`, `totalAmount`, `status`), or map the result through a DTO function before returning.

### 2. Inventory Checkout Race Condition
**Severity:** High
**File:** `/src/backend/services/storefront/checkout.service.ts`
**Root Cause:** The checkout transaction reads `quantityAvailable` and then decrements it later. Under high concurrency, Prisma interactive transactions without row-level locks can read stale data, allowing inventory to drop below zero.
**Fix:** Execute a raw SQL `UPDATE ... WHERE quantityAvailable >= X` to leverage database-level atomic checks, or ensure a database `CHECK (quantityAvailable >= 0)` constraint is applied manually via a Prisma migration.

### 3. Missing PostgreSQL Foreign Key Indexes
**Severity:** High
**File:** `/prisma/schema.prisma`
**Root Cause:** Prisma does not automatically generate indexes for PostgreSQL foreign keys. Tables like `OrderItem` and `Inventory` will face sequential scans on queries and cascaded deletions.
**Fix:** Append `@@index([orderId])`, `@@index([productId])`, and `@@index([variantId])` to the respective models in `schema.prisma`.

### 4. RBAC UI Hardening
**Severity:** Medium
**File:** `/src/components/layout/ProtectedRoute.tsx`
**Root Cause:** The generic ProtectedRoute only verifies authentication, meaning a valid user can navigate to `/admin/settings` directly, bypass UI hiding, and trigger a raw 403 API failure state in the UI.
**Fix:** Pass `requiredModule` to `ProtectedRoute`, invoke `hasPermission`, and render a proper 403 "Forbidden" component if the check fails before rendering children.

### 5. Middleware N+1 Performance Issue
**Severity:** Medium
**File:** `/src/backend/middlewares/auth.ts`
**Root Cause:** `requirePermission` executes `await prisma.role.findUnique()` on every single protected route execution, separate from the user lookup in `requireAuth`.
**Fix:** Modify `requireAuth` to include permissions during the initial user lookup (`include: { role: { include: { permissions: true } } }`), and attach them to `req.user.permissions`, entirely removing the second DB query from `requirePermission`.
