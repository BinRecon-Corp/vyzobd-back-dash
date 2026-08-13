# Storefront Pagination & Response Format Audit

The audit identified a structural inconsistency in how JSON responses are wrapped across different domains in the Storefront backend. While data remains functionally intact, frontend developers will need to account for these differing wrappers in their SDK.

## Response Wrapper Matrix

### 1. Product API (`getProducts`)
**Format**: Bare JSON with `meta` wrapping.
```json
{
  "data": [...],
  "meta": { "total": X, "page": X, "limit": X, "totalPages": X },
  "ga4": {...}
}
```

### 2. Search API (`searchProducts`)
**Format**: Bare JSON with `meta` wrapping.
```json
{
  "data": [...],
  "meta": { "total": X, "page": X, "limit": X, "totalPages": X }
}
```

### 3. Orders / Customer APIs (`getCustomerOrders`)
**Format**: Standardized `status` wrapper with nested `pagination`.
```json
{
  "status": "success",
  "data": {
    "orders": [...],
    "pagination": { "total": X, "page": X, "limit": X, "totalPages": X }
  }
}
```

### 4. Blog APIs (`getBlogPosts`)
**Format**: `success` boolean wrapper.
```json
{
  "success": true,
  "data": [...],
  "meta": {}
}
```

## Conclusion
**Status: PARTIAL (Inconsistent)**
The APIs functionally work and securely retrieve data. However, the Frontend client (Next.js) will require specific interceptor mapping depending on the endpoint category to normalize `meta` vs `data.pagination` objects. This is not a blocker, but an architectural idiosyncrasy.
