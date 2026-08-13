# Marketing Campaign API Implementation (`README_CAMPAIGN_IMPLEMENTATION.md`)

## Implementation Status: PASS

## Files Changed/Created
- `src/backend/dtos/storefront/types.ts`: Added `StorefrontCampaign`.
- `src/backend/dtos/storefront/mappers.ts`: Added `mapCampaignToStorefrontDTO`.
- `src/backend/services/storefront/content.service.ts`: Added `getActiveCampaigns()`.
- `src/backend/controllers/storefront/home.controller.ts`: Added `getCampaigns`.
- `src/backend/routes/storefront/campaign.routes.ts`: Registered `GET /`.
- `server.ts`: Mounted `/api/storefront/v1/campaigns`.

## Endpoint Details
**Route:** `GET /api/storefront/v1/campaigns`

**Database Query Rules:**
- `deletedAt = null`
- Status validation: Either `status = Sent` OR (`status = Scheduled` AND `scheduledAt <= now`).

**DTO Sanitization:**
Excluded campaign `metrics` (open rates, click rates), internal analytics, and timestamps to prevent internal business intelligence leakage.

## API Example
```json
{
  "status": "success",
  "data": [
    {
      "id": "789",
      "name": "Summer Newsletter",
      "type": "Email",
      "subject": "Our biggest summer sale!",
      "content": "<html><body>...</body></html>"
    }
  ]
}
```
