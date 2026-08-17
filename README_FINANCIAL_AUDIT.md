# Financial Consistency Audit

## Cart & Order Pricing
**Status: PASS**
- **Calculation Core:** Cart values evaluate securely inside `getCheckoutSession()` off the backend database payload, negating any client-side JSON price injections.
- **Formulas:** Correctly groups subtotal matching unit constraints, limits discount floors safely (e.g., `Prisma.Decimal.max(0, subtotal.sub(discount))`), and correctly scales a static 10% tax.
- **Rounding:** `toDecimalPlaces(2)` safely applied to floats mitigating long-tail decimal inflation over time.

## Database Readiness
**Status: PASS**
- Inspected PostgreSQL models dynamically utilizing proper relational `Decimal` mappings on `Payment`, `Refund`, and `Coupon`.
- Constraints prevent detached items mapping to dropped users.
