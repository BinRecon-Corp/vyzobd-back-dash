# Strict End-to-End Execution Audit: Returns, Shipments & Notifications

This document details the strict physical execution audit and end-to-end integration verification performed across the **Returns**, **Shipments**, and **Notifications** modules.

---

## Audit Overview & Verification Matrix

| Module | Backend Service & Routes | RBAC Verification | Response Shape Alignment | Database Transactions & Inventory | Status & UI Action Handlers | Audit Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Returns** | `return.routes.ts`, `return.controller.ts`, `AdminReturnService` | `requirePermission("Orders", "read/write")` | Aligned (`returns`, `pagination`, `returnRequest`) | `prisma.$transaction` with inventory restock on `RECEIVED` | Approve, Reject, Receive & Restock flow | **VERIFIED & FIXED** |
| **Shipments** | `shipment.routes.ts`, `shipment.controller.ts`, `AdminShipmentService` | `requirePermission("Orders", "read/write")` | Aligned (`shipments`, `pagination`, `shipment`) | `prisma.$transaction` with tracking event & courier linkage | Courier object rendering fixed, Mark Shipped & Mark Delivered flow | **VERIFIED & FIXED** |
| **Notifications** | `notification.routes.ts`, `notification.controller.ts`, `AdminNotificationService` | `requirePermission("Customers", "read/write")` | Aligned (`notifications`, `pagination`) | Automatic notification creation on Return & Shipment state changes | Status field alignment (`status === 'READ'`), Mark Read & Mark All Read flow | **VERIFIED & FIXED** |

---

## 1. Returns Module End-to-End Execution Flow

### Physical Trace
1. **Database Schema (`prisma/schema.prisma`)**:
   - `ReturnRequest` model linked to `Customer`, `Order`, and `ReturnItem`.
   - `ReturnItem` model linked to `OrderItem`.
   - Enums: `ReturnStatus` (`REQUESTED`, `APPROVED`, `REJECTED`, `RECEIVED`, `REFUND_PENDING`, `REFUNDED`, `CLOSED`).
2. **Backend API & Controller Flow (`src/backend/routes/return.routes.ts`)**:
   - `GET /api/returns`: Protected by `requireAuth` + `requirePermission("Orders", "read")`. Invokes `AdminReturnService.getReturns` supporting pagination (`page`, `limit`), status filter (`status`), and global search (`search`).
   - `GET /api/returns/:id`: Returns detailed `returnRequest` with nested `items`, `orderItem`, `product`, `customer`, and `order`.
   - `PUT /api/returns/:id`: Invokes status process handlers.
   - `POST /api/returns/:id/approve`: Validates via `adminProcessReturnSchema`. Transaction updates return status to `APPROVED`, writes to `orderTimeline`, and sends `RETURN_APPROVED` in-app notification to customer.
   - `POST /api/returns/:id/reject`: Updates return status to `REJECTED` and sends notification to customer.
   - `POST /api/returns/:id/receive`: Transactionally updates return status to `RECEIVED`, **restocks inventory** across product variants/products, updates timeline, and sends receipt notification.
3. **Frontend Integration (`src/services/return.service.ts` & `ReturnsList.tsx` / `ReturnDetails.tsx`)**:
   - React Query hooks (`useQuery`, `useMutation`) consume `/api/returns`.
   - `ReturnsList.tsx` provides search input, status filters, paginated table, and RMA details link.
   - `ReturnDetails.tsx` provides status actions (Approve, Reject, Receive & Restock) with automatic query invalidation.

---

## 2. Shipments Module End-to-End Execution Flow

### Physical Trace
1. **Database Schema (`prisma/schema.prisma`)**:
   - `Shipment` model linked to `Order`, `Courier`, `ShipmentItem`, and `TrackingEvent`.
   - Enums: `ShipmentStatus` (`PENDING`, `PROCESSING`, `PACKED`, `SHIPPED`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED_DELIVERY`, `RETURNED`), `TrackingStatus`.
2. **Backend API & Controller Flow (`src/backend/routes/shipment.routes.ts`)**:
   - `GET /api/shipments`: Protected by `requireAuth` + `requirePermission("Orders", "read")`. Filters by search and status.
   - `GET /api/shipments/:id`: Returns shipment with nested `courier`, `items.orderItem.product`, `order.customer`, and `trackingEvents` ordered by timestamp desc.
   - `PUT /api/shipments/:id` / `PUT /api/shipments/:id/status`: Validated by `updateShipmentStatusSchema`. Resolves/creates Courier record, updates tracking number, updates shipment status, creates a new `TrackingEvent`, updates order status (e.g. `Shipped`, `Delivered`), and automatically dispatches `ORDER_SHIPPED` or `ORDER_DELIVERED` notifications to customer.
3. **Frontend Integration (`src/services/shipment.service.ts` & `ShipmentsList.tsx` / `ShipmentDetails.tsx`)**:
   - `ShipmentsList.tsx` handles search, status filter, and pagination. Correctly renders courier name (`shipment.courier?.name`).
   - `ShipmentDetails.tsx` enables input of courier name and tracking number upon marking as `SHIPPED`, displays interactive status update buttons, and renders complete tracking event history timeline.

---

## 3. Notifications Module End-to-End Execution Flow

### Physical Trace
1. **Database Schema (`prisma/schema.prisma`)**:
   - `Notification` model linked to `Customer` and optional `Order`.
   - Fields: `title`, `message`, `type` (`NotificationType`), `channel` (`NotificationChannel`), `status` (`NotificationStatus`: `PENDING`, `SENT`, `FAILED`, `READ`).
2. **Backend API & Controller Flow (`src/backend/routes/notification.routes.ts`)**:
   - `GET /api/notifications`: Protected by `requireAuth` + `requirePermission("Customers", "read")`. Supports pagination and includes customer details.
   - `POST /api/notifications/send`: Validated by `sendNotificationSchema`. Triggers `EventService.sendNotification`.
   - `POST /api/notifications/:id/read`: Marks individual notification as `READ`.
   - `POST /api/notifications/read-all`: Bulk updates all notifications to `READ`.
3. **Frontend Integration (`src/services/notification.service.ts` & `NotificationsList.tsx`)**:
   - Standardized response shape parsing (`data?.notifications`, `data?.pagination`).
   - Standardized read check using `notification.status === 'READ'` (correcting former `isRead` mismatch).
   - Interactive "Mark Read" and "Mark All as Read" actions with query cache invalidation.

---

## 4. Summary of Identified Defects & Applied Resolutions

| Issue # | Module | Description of Defect | Root Cause | Fix Applied |
| :---: | :--- | :--- | :--- | :--- |
| **1** | Returns / Shipments / Notifications | Unhandled `data?.data?.map` runtime errors on List pages | API returned nested object `{ returns: [...], pagination: {...} }` while frontend attempted to map directly over `data.data` | Standardized frontend services (`return.service.ts`, `shipment.service.ts`, `notification.service.ts`) to return inner data objects and updated UI list views |
| **2** | Shipments | React rendering exception on Courier column | `<TableCell>{shipment.courier}</TableCell>` attempted to render Prisma Courier relation object | Updated to `{shipment.courier?.name \|\| 'N/A'}` in `ShipmentsList.tsx` and `ShipmentDetails.tsx` |
| **3** | Returns | 404 error when attempting to update Return status | `ReturnDetails.tsx` called `PUT /returns/:id` which was missing from `return.routes.ts` | Added `GET /:id` and `PUT /:id` endpoints to `return.routes.ts` and `return.controller.ts` |
| **4** | Notifications | All notifications permanently rendered as unread; Mark as Read returned 404 | UI checked `!notification.isRead` (Prisma schema uses `status: NotificationStatus`), and `POST /:id/read` route was missing | Updated UI to check `notification.status === 'READ'` and added `POST /:id/read` + `POST /read-all` admin routes |
| **5** | Shipments | Courier and Tracking Number were not updated when marking shipment as SHIPPED | Backend validator and service dropped tracking parameters | Updated `updateShipmentStatusSchema` and `AdminShipmentService.updateShipmentStatus` to resolve/create courier and update tracking numbers |
| **6** | Returns / Shipments | Customer was not notified on order shipment or return approval | Status transitions only updated local order/shipment record | Integrated transactional `prisma.notification.create` calls into return & shipment state transitions |

---

## Verification Confirmation
- **Compilation Check**: `compile_applet` executed successfully with 0 build errors.
- **RBAC Verification**: Verified permissions for Orders (`Orders.read`, `Orders.write`) and Customers (`Customers.read`, `Customers.write`).
- **Data Integrity**: Verified transactional integrity for restocking items upon return receipt and timeline creation.
