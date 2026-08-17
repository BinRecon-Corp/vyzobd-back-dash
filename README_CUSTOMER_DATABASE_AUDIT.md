# Customer Database Audit

Physically verified Prisma ORM declarations mapping into the PostgreSQL schema.

## Audited Models
1. **Customer**: Properly defined. Constrained by `email` uniqueness. Fully relational. Supports AuthProvider sets (`LOCAL`, `GOOGLE`, `FACEBOOK`).
2. **CustomerRefreshToken**: Physically supports multiple sessions per-user mapping IP address and User-Agent with cascading deletes. `tokenHash` indexed.
3. **CustomerAddress**: Properly stores normalized country, city, street attributes alongside `isDefault` mapping logic. Indexed `customerId`.
4. **CustomerActivity**: Standardized for tracking logins and account mutations mapping directly to `ActivityType` enums.
5. **Wishlist**: Properly scales with cross-join mapping via `WishlistItem` connected to Active products. Prevents raw duplication efficiently via `wishlistId_productId` composite unique key indexes.
6. **Notification**: Scales `NotificationType`, channels (`IN_APP`, `EMAIL`, etc.) and reads. Fully relation-bound to Orders and Customers.
7. **Order / ReturnRequest**: Safely defines complex state machines over Tracking, Statuses, Shipments, mapping deeply nested relationship arrays on `ReturnItem` to physical products.
8. **NotificationPreference**: Successfully scales boolean opt-outs specific to individual customers matching preferences cleanly.

## Database Constraints & Keys
- All Customer foreign keys appropriately implement `onDelete: Cascade` where required, avoiding orphaned datasets upon Customer soft- or hard-deletion procedures.
- Indexing `@@index([customerId])` safely applied across all relational read-heavy tables (Orders, Addresses, Returns, Wishlist, Activity) preventing table-scan bottlenecks during heavy Storefront API loads.
