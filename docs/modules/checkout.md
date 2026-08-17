# Checkout Engine Module

## Overview
Orchestrates the order creation workflow, validating coupon discounts, address selections, shipping fees, tax calculations, and atomic stock reservation.

## Processing Flow
1. Verify item availability in `Inventory`.
2. Apply active `Coupon` discount rules.
3. Compute shipping rates based on `ShippingSetting` rules.
4. Reserve stock levels and generate `Order` and `OrderItem` records in a Prisma transaction.
