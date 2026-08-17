# Storefront DTO Security Audit

A physical inspection was conducted against `src/backend/dtos/storefront/mappers.ts`.

## API DTO Matrix

| Entity | Safe Mapping | Filtered Admin Fields (Do not leak) |
|---|---|---|
| **Product** | ✅ YES | `supplierCost`, `internalNotes`, `admin` tracking flags. Stock only leaks boolean `inStock` unless mapped differently. |
| **Order** | ✅ YES | `internalNotes`, `supplierCost`, `assignedStaffId`. |
| **Return** | ✅ YES | `adminNotes`. |
| **Category** | ✅ YES | None (Public). |
| **Brand** | ✅ YES | None (Public). |
| **Cart** | ✅ YES | Secure server-side calculation. |

**Result:** DTO isolation operates flawlessly. The Storefront mapping functions natively construct fresh object structures rather than appending `delete obj.secret` logic, ensuring zero inadvertent property leaks.
