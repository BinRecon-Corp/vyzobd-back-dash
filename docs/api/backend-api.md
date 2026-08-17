# Admin Backend API Reference

Base Path: `/api/v1`

All endpoints require Admin JWT Authentication (`Authorization: Bearer <token>`) and specific RBAC permissions.

---

## 1. User & Role Management

### GET `/users`
Fetch system admin users.
- **Auth**: Required (`requireAuth`), Permission: `users:read`

### POST `/roles`
Create new RBAC Role with attached permission IDs.
- **Auth**: Required (`requireAuth`), Permission: `roles:create`

---

## 2. Order Management System (OMS)

### GET `/orders`
Fetch customer orders with filtering by status, date range, and payment status.
- **Auth**: Required (`requireAuth`), Permission: `orders:read`

### PUT `/orders/:id/status`
Update order status (e.g. `PROCESSING` -> `SHIPPED`).
