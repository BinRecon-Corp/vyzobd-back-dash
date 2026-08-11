# Financial Safety Audit

## 1. Summary
Financial transactions (checkout, payments, refunds) use database transactions to ensure consistency.

## 2. Evidence & Findings

### Inventory Race Conditions
- **Critical Risk**: In `StorefrontCheckoutService.completeCheckout`, the system reads the product inventory state via `await tx.product.findUnique()`. Later in the same transaction, it decrements the inventory. Because Prisma does not enforce Row-Level Locks (e.g., `SELECT ... FOR UPDATE`) natively on `findUnique`, highly concurrent checkouts for the exact same variant could read the same available quantity and successfully decrement it below zero, depending on database constraints.
- No `CHECK (quantityAvailable >= 0)` constraint exists natively in the schema for `Inventory`.

### Double Refund Prevention
- Handled properly via transaction blocks and `Refund` model state tracking.

## 3. Score
**Financial Safety Score**: 65/100
