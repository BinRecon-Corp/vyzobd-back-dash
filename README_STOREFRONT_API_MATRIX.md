# Storefront API Matrix

| API Group         | DTO Safety | Status  | Identified Inconsistencies / Notes |
|-------------------|------------|---------|------------------------------------|
| **Products**      | Safe       | PASS    | Does not use `status: "success"` wrapper. Returns raw `{ data, meta, ga4 }`. Filters active items safely. |
| **Categories**    | Safe       | PASS    | Nested hierarchy mapped successfully via `mapCategoryToStorefrontDTO`. |
| **Brands**        | Safe       | PASS    | Mapped safely. |
| **Customer Auth** | Safe       | PASS    | Implements secure JWT access & refresh rotations. |
| **Customer Acc**  | Safe       | PASS    | Properly segregated using `requireCustomerAuth`. |
| **Cart**          | Safe       | PASS    | Stock evaluation happens server-side cleanly via `StorefrontCartService`. |
| **Checkout**      | Safe       | PASS    | Grand total computed server-side mitigating JSON price manipulation. |
| **Orders**        | Safe       | PASS    | `mapOrderToStorefrontDTO` strips `internalNotes`, `adminNotes`, `supplierCost`. |
| **Payments**      | Safe       | PASS    | Duplication guard present. Status hooks implemented safely. |
| **Returns**       | Safe       | PASS    | Order ownership validation executed perfectly. |
| **Blog/CMS**      | Safe       | PASS    | Basic content delivery. Wrapper is `{ success: true, data, meta }`. |
| **Settings**      | Safe       | PASS    | `getPublicSettings` acts as dynamic storefront config initialization route. |
