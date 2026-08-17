# Troubleshooting PostgreSQL Database Issues

## 1. Connection Pool Exhaustion (`P1001: Cannot reach database`)
- **Cause**: Active client connection count exceeded PostgreSQL `max_connections`.
- **Resolution**: Increase `max_connections` in `postgresql.conf` or append `connection_limit=20` parameter to `DATABASE_URL`.

## 2. Slow Queries & Unindexed Filter Fields
- **Diagnosis**: Run `EXPLAIN ANALYZE` on slow SQL statements.
- **Resolution**: Add composite or single-column indexes in `prisma/schema.prisma` and generate migration.
