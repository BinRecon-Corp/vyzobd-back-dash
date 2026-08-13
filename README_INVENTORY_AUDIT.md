# Inventory Safety Audit

## Decrement on Order
**Status: PASS**
- Processed via `StorefrontCheckoutService.completeCheckout`.
- Executes inside a `$transaction` using deterministic arithmetic `decrement` operations to negate race-condition oversells perfectly.

## Increment on Return (Patched)
**Status: PASS**
- Found a critical bug in `AdminReturnService.receiveReturn` where `updateMany` by variant ID restored the inventory across ALL configured warehouses, artificially inflating stocks.
- **Fix Applied:** Modified logic to cleanly `findFirst` the correct inventory tracking log, and apply `update` only to that specific record ID.

## Increment on Cancellation (Patched)
**Status: PASS**
- Discovered there was no native inventory restoration when an Admin cancels a Pending order inside `order.controller.ts`.
- **Fix Applied:** Patched `updateOrderStatus` to hook into `status === "Cancelled"`, running iterative restore increments mapped back onto their source inventory records securely.
