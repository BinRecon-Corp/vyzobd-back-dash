# Troubleshooting Prisma ORM Issues

## 1. Schema Drift & Out-of-Sync Client
- **Symptom**: `PrismaClientValidationError` or missing property errors in TypeScript.
- **Resolution**:
```bash
npx prisma db pull # Sync schema with database (if external changes occurred)
npx prisma generate # Re-generate Prisma Client types
```

## 2. Pending Migrations in Production
- **Symptom**: `P3005: The database schema is not empty`.
- **Resolution**: Run `npx prisma migrate deploy` instead of `migrate dev` in production environments.
