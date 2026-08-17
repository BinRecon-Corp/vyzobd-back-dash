# Popups & Modal Campaigns Audit Report (`README_POPUP_AUDIT.md`)

## 1. Physical Trace Summary
* **Component Description**: Homepage overlays, exit intent newsletter forms, coupon revealers, and cart-milestone modal alerts.
* **Component Rating**: ❌ **FAIL** (Not delivered to storefront).

### Trace Map
```
  [Admin Controller] -> Writes `Popup` database record (OK)
  [Database: pgSQL]  -> Correctly persists `Popup` table (OK)
  [Storefront API]   -> NO ENDPOINT EXISTS (FAIL)
  [DTO Mapper]       -> NO DTO MAPPER EXISTS (FAIL)
  [Next.js Client]   -> Render is blocked (FAIL)
```

---

## 2. Core Findings & Root Cause

* **Admin Implementation**: Managed fully via `/src/backend/controllers/popup.controller.ts` and `/src/backend/routes/popup.routes.ts`.
* **Storefront Implementation**: No storefront-facing API exists to deliver popups. Next.js storefront pages cannot query for active overlay assets or custom delay times.

---

## 3. Database vs Storefront DTO Specifications

### Verified Database Fields
The `Popup` model is declared in `/prisma/schema.prisma` with these attributes:
* `id` (String, Primary Key)
* `title` (String)
* `type` (String, Default: `"homepage"`) - Options: `"exit_intent"`, `"homepage"`, `"product"`, `"coupon"`.
* `headline` (String, Optional)
* `body` (String, Optional)
* `couponCode` (String, Optional)
* `imageUrl` (String, Optional)
* `delaySeconds` (Int, Default: 0)
* `isActive` (Boolean, Default: true)
* `deletedAt` (DateTime, Optional)

### Missing Storefront DTO Structure
The public DTO must expose relevant triggers and configurations while shielding admin logs:
```typescript
export interface StorefrontPopup {
  id: string;
  title: string;
  type: string;
  headline: string | null;
  body: string | null;
  couponCode: string | null;
  imageUrl: string | null;
  delaySeconds: number;
}
```

---

## 4. Operational Filtering & Business Rules
To deliver contextual popups to visitors on the storefront homepage, queries must implement:
1. **Soft Deletion Check**: `deletedAt` must be `null`.
2. **Active State Verification**: `isActive` must be `true`.
3. **Trigger Placement**: Group and filter popups by the query parameter `type` (e.g. `homepage` vs `exit_intent`).

---

## 5. Physical Code Corrections

To support popups, add these components:

### A. Service Method (`src/backend/services/storefront/content.service.ts`)
```typescript
async getActivePopups(type?: string) {
  return prisma.popup.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      ...(type ? { type } : {})
    },
    orderBy: { createdAt: "desc" }
  });
}
```

### B. Controller & Route Registration (`server.ts`)
Mount a public endpoint inside the storefront router block:
```typescript
storefrontRouter.get("/popups", async (req, res) => {
  const { type } = req.query;
  const popups = await storefrontContentService.getActivePopups(type ? String(type) : undefined);
  res.json({
    status: "success",
    data: popups.map(p => ({
      id: p.id,
      title: p.title,
      type: p.type,
      headline: p.headline,
      body: p.body,
      couponCode: p.couponCode,
      imageUrl: p.imageUrl,
      delaySeconds: p.delaySeconds
    }))
  });
});
```
