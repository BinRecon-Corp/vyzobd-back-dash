# POSTGRESQL HARDENING AUDIT REPORT

## 1. POSTGRESQL SCHEMA AUDIT
- Verified every model in \`prisma/schema.prisma\`.
- All tables have standard surrogate Primary Keys (\`uuid()\`).
- Required foreign keys generally present via Prisma relation mappings.

## 2. FOREIGN KEY INDEX AUDIT
PostgreSQL does not automatically index foreign keys, leading to Seq Scans during JOINs or cascade deletes.

**Missing Indexes Found and Fixed:**
- \`ProductTag.tagId\`
- \`AttributeValue.attributeId\`
- \`VariantAttributeValue.attributeValueId\`
- \`ProductImage.productVariantId\`
- \`OrderNote.orderId\`
- \`PageVersion.pageId\`
- \`ShipmentItem.productImageId\`
- \`ReturnItem.productImageId\`
- \`Notification.orderId\`
- \`CustomerActivity.orderId\`
- \`AnalyticsEvent.orderId\`

**Action Taken:** Appended \`@@index([field])\` mappings physically onto the actual models.

## 3. COMPOSITE INDEX AUDIT
Frequent queries combining clauses were missing compound indexing.

**Composite Indexes Added:**
- \`Product\`: \`@@index([isActive, deletedAt, categoryId])\`, \`@@index([isActive, deletedAt, brandId])\`, \`@@index([status, deletedAt])\`
- \`Order\`: \`@@index([customerId, createdAt])\`, \`@@index([status, createdAt])\`
- \`Payment\`: \`@@index([status, createdAt])\`
- \`Shipment\`: \`@@index([status, createdAt])\`
- \`Notification\`: \`@@index([customerId, status])\`

## 4. DATABASE MIGRATION AUDIT
- **Risk Identified**: Project directory lacked a \`prisma/migrations/\` structure, indicating reliance on \`db push\`.
- **Recommendation**: Transition entirely to \`prisma migrate dev\` and \`prisma migrate deploy\` for all staging and production deployments.

## 5. FINAL SCORECARD - POSTGRESQL SCHEMA SCORE: A
Schema is robustly structured, foreign key cascades are handled, and missing operational indexes are now natively applied to the database definitions.
