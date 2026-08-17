# PostgreSQL Database Audit

## 1. Summary
The schema (`prisma/schema.prisma`) utilizes standard relational models, UUID primary keys, and Decimal types for financial fields. However, significant PostgreSQL optimization best practices are missing.

## 2. Evidence & Findings

### Missing Indexes on Foreign Keys
- **Performance Risk**: PostgreSQL does **not** automatically create indexes on foreign key constraints.
- **Evidence**: `OrderItem` has `orderId` and `productId`, but lacks `@@index([orderId])` and `@@index([productId])`. The same applies to `Inventory`, `Payment`, `Refund`, etc. Queries joining these tables or executing cascaded deletes will trigger sequential scans, causing massive performance degradation at scale.

### Decimal & Precision
- Fields like `totalAmount` use the `Decimal` type, which accurately prevents floating-point inaccuracies, matching enterprise standards.

### Cascade & Soft Delete
- Soft deletes are implemented using a generic `deletedAt DateTime?` column. Prisma middlewares or explicit `where: { deletedAt: null }` checks are required across the codebase.
- Physical cascade rules (e.g. `onDelete: Cascade` on `OrderItem` -> `Order`) exist and are correctly implemented.

## 3. Score
**PostgreSQL Score**: 70/100
