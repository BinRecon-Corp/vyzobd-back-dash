# Marketing Campaigns Audit Report (`README_CAMPAIGN_AUDIT.md`)

## 1. Physical Trace Summary
* **Component Description**: Marketing newsletters, notification campaigns, scheduled email blasts, and behavioral triggers.
* **Component Rating**: ❌ **FAIL** (Not delivered to storefront).

### Trace Map
```
  [Admin Controller] -> Writes `MarketingCampaign` database record (OK)
  [Database: pgSQL]  -> Correctly persists `MarketingCampaign` table (OK)
  [Storefront API]   -> NO ENDPOINT EXISTS (FAIL)
  [DTO Mapper]       -> NO DTO MAPPER EXISTS (FAIL)
  [Next.js Client]   -> Render is blocked (FAIL)
```

---

## 2. Core Findings & Root Cause

* **Admin Implementation**: Managed fully via `/src/backend/controllers/marketing.controller.ts` and `/src/backend/routes/marketing.routes.ts`.
* **Storefront Implementation**: Marketing campaigns are purely handled as an internal back-office operation (Draft, Scheduled, Sent) with no public route integration. Consequently, no active newsletter content or scheduled popups are pushed down to client browsers.

---

## 3. Database vs Storefront DTO Specifications

### Verified Database Fields
The `MarketingCampaign` model is declared in `/prisma/schema.prisma` with these attributes:
* `id` (String, Primary Key)
* `name` (String)
* `type` (String) - Options: `"Email"`, `"SMS"`, `"Push"`.
* `subject` (String, Optional)
* `content` (String) - Represents newsletter or overlay body markup.
* `status` (String, Default: `"Draft"`) - Options: `"Draft"`, `"Scheduled"`, `"Sent"`, `"Archived"`.
* `scheduledAt` (DateTime, Optional)
* `sentAt` (DateTime, Optional)
* `metrics` (String, Optional) - JSON string representing performance data (open rates, click rates, conversions).
* `deletedAt` (DateTime, Optional)

### Missing Storefront DTO Structure
A public campaign DTO is generally restricted to newsletters or scheduled triggers:
```typescript
export interface StorefrontCampaign {
  id: string;
  name: string;
  type: string;
  subject: string | null;
  content: string;
}
```

---

## 4. Operational Filtering & Business Rules
To safely target active, scheduled storefront notifications or newsletter campaigns:
1. **Soft Deletion Check**: `deletedAt` must be `null`.
2. **Sent/Scheduled Scoping**: The status must be strictly set to `"Sent"` or `"Scheduled"`.
3. **Date Verification**:
   - `sentAt` must be in the past, or `scheduledAt` must be lte than current time.

---

## 5. Physical Code Corrections

To support promotional newsletters or push-notification widgets, add these components:

### A. Service Method (`src/backend/services/storefront/content.service.ts`)
```typescript
async getActiveCampaigns() {
  return prisma.marketingCampaign.findMany({
    where: {
      status: "Sent",
      deletedAt: null
    },
    orderBy: { sentAt: "desc" }
  });
}
```

### B. Controller & Route Registration (`server.ts`)
Mount a public endpoint inside the storefront router block:
```typescript
storefrontRouter.get("/campaigns", async (req, res) => {
  const campaigns = await storefrontContentService.getActiveCampaigns();
  res.json({
    status: "success",
    data: campaigns.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      subject: c.subject,
      content: c.content
    }))
  });
});
```
