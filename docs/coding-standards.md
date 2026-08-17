# Coding Standards & Best Practices

## 1. TypeScript Guidelines
- **Strict Mode**: `tsconfig.json` enforces `strict: true`. Avoid using `any` types.
- **Explicit Return Types**: All service functions and API controllers must explicitly define return types.
- **Top-Level Named Imports**: Always use top-level named imports (`import { useState } from "react"`). Avoid default object destructuring.

## 2. Error Handling & Custom Exceptions
All API errors must be thrown as instances of `AppError` or handled via standard error middleware:
```typescript
export class AppError extends Error {
  public statusCode: number;
  public errors?: any[];

  constructor(message: string, statusCode = 400, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
```

## 3. Database & SQL Best Practices
- **Prisma Client Rules**: Never construct raw SQL strings with string interpolation. Always use parameterized Prisma queries.
- **Soft Deletes**: Primary models (Product, User, Customer, Category) implement soft deletion using `isDeleted: Boolean` fields.
- **Prisma Transactions**: Multi-record writes must use `prisma.$transaction` to ensure database consistency.

## 4. Naming Conventions
- **Files & Directories**: `kebab-case.ts` or `kebab-case.tsx` (e.g., `product-variant.controller.ts`).
- **Classes & React Components**: `PascalCase` (e.g., `ProductVariantService`, `AdminLayout.tsx`).
- **Variables & Functions**: `camelCase` (e.g., `getProductsBySlug`, `isUserAuthenticated`).
- **Database Tables & Models**: `PascalCase` in Prisma schema, mapping to singular/plural Postgres tables.
