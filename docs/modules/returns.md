# Return Authorization (RMA) Module

## Overview
Provides structured Return Merchandise Authorization (RMA) workflows for customer item returns.

## Workflow
1. Customer submits return request (`POST /api/storefront/v1/returns/request`) specifying order items and reason.
2. Admin reviews request in back-office OMS (`PUT /api/v1/returns/:id/status`).
3. Upon approval, shipping label is generated and stock item is restocked upon receipt.
