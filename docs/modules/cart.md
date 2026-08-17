# Shopping Cart Module

## Overview
Provides server-persisted shopping cart for authenticated customers (`Cart` and `CartItem` models) with automatic cart calculations, tax estimation, and abandoned cart tracking.

## Components
- Cart item addition, quantity updates, and deletion.
- Abandoned cart background service (`src/backend/services/abandoned_cart.service.ts`).
