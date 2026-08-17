# Postman Collection Guide

An importable Postman API Collection schema representation for testing the eCommerce Platform.

```json
{
  "info": {
    "name": "eCommerce Platform API Collection",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "baseUrl", "value": "http://localhost:3000" },
    { "key": "adminToken", "value": "" },
    { "key": "customerToken", "value": "" }
  ],
  "item": [
    {
      "name": "Public Storefront - Get Products",
      "request": {
        "method": "GET",
        "url": { "raw": "{{baseUrl}}/api/storefront/v1/products" }
      }
    },
    {
      "name": "Admin - Get Orders",
      "request": {
        "method": "GET",
        "header": [{ "key": "Authorization", "value": "Bearer {{adminToken}}" }],
        "url": { "raw": "{{baseUrl}}/api/v1/orders" }
      }
    }
  ]
}
```
