# Performance Audit

## 1. Summary
The application logic is well-structured, but database and memory efficiencies need addressing for scale.

## 2. Evidence & Findings

### N+1 Middleware Database Queries
- **Middleware Overhead**: `requirePermission` fetches the `Role` via DB on *every* protected request. This adds thousands of redundant DB queries under high load. Caching or attaching permissions directly during authentication is required.

### Database Indexing
- **Missing FK Indexes**: Orders, OrderItems, Payments, and Shipments lack explicit foreign key indexes. Scaling the platform will result in full table scans during relation traversals.

### Search Performance
- Catalog search uses `{ name: { contains: search } }`. In PostgreSQL, this requires a `pg_trgm` extension or GIN index to be performant; otherwise, it executes a slow `LIKE '%search%'` query.

## 3. Score
**Performance Score**: 50/100
