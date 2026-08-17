# Refunds & Disbursements Module

## Overview
Enables customers to request refunds for orders and allows admin staff to review, approve, process, or reject refund disbursements.

## Schema Models
- **Refund**: Holds order ID, amount, status (`PENDING`, `APPROVED`, `PROCESSED`, `REJECTED`), reason, and staff approval user ID.
- **RefundTransaction**: Gateway disbursement reference ID and raw provider response.
