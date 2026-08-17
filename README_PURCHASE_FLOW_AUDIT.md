# Phase 9.7 - Step 8: Purchase Tracking Flow Audit Report

## Audit Scope
Traced the complete ecommerce lifecycle from Product Impression -> Add to Cart -> Begin Checkout -> Order Placement -> Purchase Dispatch.

## Full Lifecycle Flow

```
[ Product View ]
   │
   ▼
trackViewItem() / ga4 payload in /api/storefront/v1/products/:id
   │
   ▼
[ Add to Cart ]
   │
   ▼
trackAddToCart() with item_id, item_name, price, quantity, item_variant
   │
   ▼
[ Begin Checkout ]
   │
   ▼
trackBeginCheckout() with cart items array and total value
   │
   ▼
[ Payment & Order Submission ]
   │
   ▼
Backend Order Controller -> Order Created in DB
   │
   ├── Client-Side: trackPurchase({ transaction_id, value, tax, shipping, items })
   └── Server-Side: MeasurementProtocolService.trackPurchase(order)
```

## Data Bleed & Duplicate Prevention
1. **DataLayer Cleanup**: Before every push, `window.dataLayer.push({ ecommerce: null })` is executed to wipe lingering properties from previous interactions.
2. **Transaction ID Deduplication**: Standard GA4 deduplication applies using `transaction_id` (Order Number) matching between client and Measurement Protocol events.
3. **Currency Consistency**: All prices are formatted as numbers (`Number(item.price)`) and tagged with standard ISO 4217 currency codes (`USD`).
