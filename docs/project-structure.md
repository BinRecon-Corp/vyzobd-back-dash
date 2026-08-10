# Project Directory Structure

## 1. Top-Level Directory Layout
```
├── prisma/                 # Prisma ORM Database Schema & Migration files
│   ├── schema.prisma       # Complete PostgreSQL Data Model
│   └── seed.ts             # Initial Roles, Permissions, Admin User, Settings Seeder
├── src/                    # Source Code (Frontend & Backend)
│   ├── backend/            # Express Node.js Server Architecture
│   │   ├── config/         # System Configs (Env, Logger, Swagger)
│   │   ├── controllers/    # Request Handlers (Admin & Storefront)
│   │   ├── dtos/           # Data Transfer Objects
│   │   ├── middlewares/    # Custom Middleware Functions
│   │   ├── routes/         # Express Router Mapping
│   │   ├── services/       # Core Domain Business Logic
│   │   ├── utils/          # Token, Encryption, Formatting Utilities
│   │   └── validators/     # Zod Request Validation Schemas
│   ├── components/         # React UI Components
│   │   ├── layout/         # Header, Sidebar, Admin Layout, Storefront Layout
│   │   └── ui/             # Reusable UI Primitives (Button, Modal, Table)
│   ├── context/            # React Global State Contexts
│   ├── hooks/              # Custom React Hooks
│   ├── lib/                # Shared Helper Functions
│   ├── pages/              # Application Screen Views
│   │   ├── admin/          # Back-Office OMS & CMS Pages
│   │   ├── storefront/     # Customer E-Commerce Pages
│   │   └── auth/           # Login & Registration Pages
│   ├── services/           # Axios Frontend API Clients
│   └── types.ts            # Global TypeScript Definitions
├── docs/                   # Complete Platform Technical Documentation
├── server.ts               # Server Entry Point & Express Setup
├── package.json            # NPM Package Declarations & Scripts
└── .env.example            # Environment Configuration File
```

## 2. Backend Architecture Design Pattern

The backend strictly implements the **Controller-Service-Repository (Prisma)** pattern:

### Controller Example (`src/backend/controllers/product.controller.ts`)
```typescript
import { Request, Response, NextFunction } from "express";
import * as productService from "../services/product.service";

export async function getProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await productService.getProducts(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
```

### Service Example (`src/backend/services/product.service.ts`)
```typescript
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getProducts(queryParams: any) {
  const { page = 1, limit = 10, search } = queryParams;
  const where: any = { isDeleted: false };
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: { category: true, brand: true },
    }),
    prisma.product.count({ where }),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}
```
