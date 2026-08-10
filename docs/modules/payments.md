# Payment Gateways Module

## Overview
Supports multi-provider payment processing (Stripe, PayPal, Razorpay, SSLCommerz, Bkash) with transactional status logging and webhook verification.

## Features
- Payment initiation & intent generation.
- Idempotent webhook processing via `PaymentWebhookLog`.
- Payment status transitions (`PENDING`, `PAID`, `FAILED`, `REFUNDED`).
