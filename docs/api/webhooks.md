# Webhooks & External Event Handlers

Base Endpoint: `POST /api/storefront/v1/payment/webhook/:provider`

Supported `:provider` values: `stripe`, `paypal`, `razorpay`, `sslcommerz`, `bkash`.

## Processing Flow
1. Webhook endpoint receives raw payload and gateway signature header.
2. Provider-specific signature verification is performed.
3. Transactional log record is created in `PaymentWebhookLog`.
4. If payment event is `PAYMENT_SUCCESS`:
   - Associated `Order` financial status transitions to `PAID`.
   - Order fulfillment status updates to `PROCESSING`.
   - Notification email is queued.
