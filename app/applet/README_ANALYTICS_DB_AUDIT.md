# Analytics Database Audit

This document details the audit of the database schema and persistence layer for analytics settings.

## Model Audit (`prisma/schema.prisma`)

The `AnalyticsSetting` model defines the database structure for all tracking credentials and configuration:

```prisma
model AnalyticsSetting {
  id                 String   @id @default(uuid())
  googleAnalyticsId  String?
  googleTagManagerId String?
  facebookPixelId    String?
  tiktokPixelId      String?
  googleAdsId        String?
  ga4ApiSecret       String?
  hotjarId           String?
  enableAnalytics    Boolean  @default(false)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

## Persistence Audit (`src/backend/services/setting.service.ts`)

- `SettingService.getAnalytics()` retrieves or initializes the `AnalyticsSetting` record.
- `SettingService.updateAnalytics(data, userId)` correctly:
  1. Maps incoming field aliases (`ga4MeasurementId` -> `googleAnalyticsId`, `gtmContainerId` -> `googleTagManagerId`, `metaPixelId` -> `facebookPixelId`).
  2. Filters payload attributes against allowed Prisma model fields (`googleAnalyticsId`, `googleTagManagerId`, `facebookPixelId`, `tiktokPixelId`, `googleAdsId`, `ga4ApiSecret`, `hotjarId`, `enableAnalytics`).
  3. Executes `prisma.analyticsSetting.update` or `prisma.analyticsSetting.create`.
  4. Records an audit log entry in `prisma.activityLog` with action `UPDATE_ANALYTICS`.

## Verification Status
- **Schema Compliance**: PASSED
- **Data Persistence**: VERIFIED
- **Audit Logging**: VERIFIED
