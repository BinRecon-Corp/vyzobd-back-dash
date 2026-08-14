# Phase 9.7 - Step 7: Ecommerce Events Audit Report

## Audit Scope
Physically verified the implementation and payload correctness of all standard GA4 ecommerce events across client and server layers.

## Event Payload Matrix

| GA4 Event | Mandatory Parameters | Service Mapping Method | Frontend Helper | Status |
|---|---|---|---|---|
| `view_item_list` | `item_list_name`, `items` | `ga4Service.getProductListPayload` | `trackViewItemList` | VERIFIED |
| `view_item` | `currency`, `value`, `items` | `GA4MappingService.generateViewItemEvent` | `trackViewItem` | VERIFIED |
| `select_item` | `item_list_id`, `items` | `ga4Service.getProductDetailPayload` | `trackSelectItem` | VERIFIED |
| `add_to_cart` | `currency`, `value`, `items` | `GA4MappingService.mapProductToGA4Item` | `trackAddToCart` | VERIFIED |
| `remove_from_cart` | `currency`, `value`, `items` | `GA4MappingService.mapProductToGA4Item` | `trackRemoveFromCart` | VERIFIED |
| `view_cart` | `currency`, `value`, `items` | `ga4Service.getProductDetailPayload` | `trackViewCart` | VERIFIED |
| `begin_checkout` | `currency`, `value`, `items` | `GA4MappingService.mapProductToGA4Item` | `trackBeginCheckout` | VERIFIED |
| `add_shipping_info`| `currency`, `value`, `shipping_tier`, `items` | `GA4MappingService.mapProductToGA4Item` | `trackAddShippingInfo` | VERIFIED |
| `add_payment_info` | `currency`, `value`, `payment_type`, `items` | `GA4MappingService.mapProductToGA4Item` | `trackAddPaymentInfo` | VERIFIED |
| `purchase` | `transaction_id`, `value`, `currency`, `items` | `MeasurementProtocolService.trackPurchase` | `trackPurchase` | VERIFIED |
| `refund` | `transaction_id`, `value`, `currency` | `MeasurementProtocolService.trackRefund` | `trackRefund` | VERIFIED |

## Payload Validation
All client-side events pass through `validateGA4EventParams` in `src/lib/ga4-ecommerce.ts`, validating item schemas with Zod before pushing to `dataLayer`.
