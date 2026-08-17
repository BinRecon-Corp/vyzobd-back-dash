# GA4 Ecommerce Events Audit & Specification

This document details the client-side GA4 ecommerce tracking infrastructure implemented for storefront interactions.

## Infrastructure Overview
- **Type Definitions & Validation**: `src/lib/ga4-ecommerce.ts`
- **dataLayer Event Pusher**: `src/lib/ga4.ts`
- **React Hook Integration**: `src/hooks/useGA4.ts`
- **Utility Pushers**: `src/utils/analytics.ts`

## Supported GA4 Ecommerce Events

| Event Name | Function / Method | Key Parameters |
| :--- | :--- | :--- |
| `view_item_list` | `trackViewItemList()` | `item_list_id`, `item_list_name`, `items` |
| `select_item` | `trackSelectItem()` | `item_list_id`, `item_list_name`, `items` |
| `view_item` | `trackViewItem()` | `currency`, `value`, `items` |
| `add_to_cart` | `trackAddToCart()` | `currency`, `value`, `items` |
| `remove_from_cart` | `trackRemoveFromCart()` | `currency`, `value`, `items` |
| `view_cart` | `trackViewCart()` | `currency`, `value`, `items` |
| `begin_checkout` | `trackBeginCheckout()` | `currency`, `value`, `items` |
| `add_shipping_info` | `trackAddShippingInfo()` | `currency`, `value`, `shipping_tier`, `items` |
| `add_payment_info` | `trackAddPaymentInfo()` | `currency`, `value`, `payment_type`, `items` |
| `purchase` | `trackPurchase()` | `transaction_id`, `value`, `currency`, `tax`, `shipping`, `items` |
| `refund` | `trackRefund()` | `transaction_id`, `value`, `currency`, `items` |

## DataLayer Clearing Pattern
Before every ecommerce event push, `window.dataLayer.push({ ecommerce: null })` is executed to wipe state from previous events and prevent property leak:

```typescript
const pushToDataLayer = (eventName: string, eventParams: any) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null }); // Clear previous ecommerce object
    window.dataLayer.push({
      event: eventName,
      ecommerce: eventParams,
    });
  }
};
```

## Verification Status
- **All 11 Events Implemented**: VERIFIED
- **Schema Validation**: VERIFIED
- **DataLayer Clearing**: VERIFIED
