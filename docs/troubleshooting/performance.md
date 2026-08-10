# Troubleshooting Performance & Bottlenecks

## 1. High API Latency & N+1 Prisma Queries
- **Cause**: Loops executing individual database queries inside map statements.
- **Resolution**: Replace query loops with Prisma `findMany` using `in` operators or relations (`include` / `select`).

## 2. Excessive Bundle Size & Slow Initial Load
- **Resolution**: Ensure Vite code-splitting and dynamic imports (`React.lazy`) are applied for heavy admin routes.
