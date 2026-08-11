# Storefront API Audit

## 1. Summary
The Storefront API handles public catalog viewing and authenticated customer actions (Cart, Checkout, Account).

## 2. Evidence & Findings

### Sensitive Data Leakage
- **Product Cost Price**: Verified in `mapProductToStorefrontDTO`. Cost prices and internal notes are **stripped** and NOT exposed. The mapping specifically selects `price`, `compareAtPrice`, and `stock`.
- **Order Data Leakage**: **CRITICAL ISSUE**. In `StorefrontOrderService.getCustomerOrderById` and `getCustomerOrders`, the Prisma query does not constrain the `select` statement on the primary `Order` model. As a result, sensitive fields like `internalNotes` and `assignedStaffId` are serialized directly to the end customer payload.

## 3. Score
**Storefront API Score**: 60/100
