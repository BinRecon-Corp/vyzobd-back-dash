# GA4 Measurement Protocol Audit

This document details the server-side GA4 Measurement Protocol integration for tracking purchases and refunds directly from backend business logic.

## Service Specification (`src/backend/services/measurement-protocol.service.ts`)

- **Collect Endpoint**: `https://www.google-analytics.com/mp/collect`
- **Database Settings Integration**: Reads `googleAnalyticsId` and `ga4ApiSecret` from `prisma.analyticsSetting.findFirst()` (falling back to process environment if absent).
- **Toggle Enforcement**: Verifies `analyticsSetting.enableAnalytics === true` prior to dispatching requests.

## Implemented Methods

### 1. `trackPurchase(order, clientId)`
Triggered upon successful storefront checkout completion in `src/backend/services/storefront/checkout.service.ts`.
- **Payload Structure**:
  - `name`: `"purchase"`
  - `params.transaction_id`: Order Number / ID
  - `params.value`: Total Amount
  - `params.currency`: Order Currency (default `"USD"`)
  - `params.items`: Mapped list of products (`item_id`, `item_name`, `price`, `quantity`)

### 2. `trackRefund(refund, order, clientId)`
Triggered upon administrative refund approval in `src/backend/services/refund.service.ts`.
- **Payload Structure**:
  - `name`: `"refund"`
  - `params.transaction_id`: Order Number / ID
  - `params.value`: Refund Amount
  - `params.currency`: Order Currency

## Security & Reliability
- Asynchronous non-blocking execution prevents database transaction delays if GA4 endpoints experience latency.
- Secret credentials (`ga4ApiSecret`) remain strictly encapsulated on the server and are never exposed via public API endpoints.

## Verification Status
- **Service Implementation**: VERIFIED
- **Database Key Resolution**: VERIFIED
- **Checkout Wiring**: VERIFIED
- **Refund Wiring**: VERIFIED
