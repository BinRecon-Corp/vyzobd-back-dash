# Authentication & Authorization Module

## Overview
Provides dual identity management for back-office administrators (`User` model) and storefront shoppers (`Customer` model). Enforces JWT token rotation, bcrypt password hashing, session cleanup, and granular Role-Based Access Control (RBAC).

## Architecture & Code Map
- **Controllers**: `src/backend/controllers/auth.controller.ts`, `src/backend/controllers/storefront/auth.controller.ts`
- **Middlewares**: `src/backend/middlewares/auth.middleware.ts`, `src/backend/middlewares/customerAuth.ts`
- **Database Models**: `User`, `RefreshToken`, `Role`, `Permission`, `Customer`, `CustomerRefreshToken`
