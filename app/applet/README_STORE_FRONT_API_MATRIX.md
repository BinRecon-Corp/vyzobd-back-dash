# Storefront API Response Matrix

The following matrix outlines what the application currently returns for different scenarios when attempting to access Storefront API endpoints (e.g., `/api/storefront/v1/banners`).

| Scenario | Request | Express Routing Path | Expected Response | Actual Observed Result |
| :--- | :--- | :--- | :--- | :--- |
| **Happy Path** (Database connected, exact URL, correct method) | `GET /api/storefront/v1/banners` | Matches `storefrontRouter` -> `banner.routes.ts` | `200 OK` (JSON) | `200 OK` (JSON with storefront data) |
| **Database Failure** (Invalid `DATABASE_URL` or DB offline) | `GET /api/storefront/v1/banners` | Matches `storefrontRouter` -> Controller crashes due to unhandled promise rejection. | `500 Internal Server Error` (JSON) | `* Empty reply from server` (Request hangs/drops because Express 4 does not catch async errors) |
| **URL Typo / Missing Endpoint** | `GET /api/storefront/v1/banner` (singular instead of plural) | Fails to match API route. Bypasses error handler. Hits SPA wildcard catch-all (`*`). | `404 Not Found` (JSON) | `200 OK` (React frontend `index.html` source code) |
| **Incorrect HTTP Method** | `POST /api/storefront/v1/banners` | Fails to match `GET` API route. Bypasses error handler. Hits SPA wildcard catch-all (`*`). | `405 Method Not Allowed` or `404` (JSON) | `200 OK` (React frontend `index.html` source code) |
| **CORS Blocked** (Origin not in `ALLOWED_ORIGINS`) | `GET /api/storefront/v1/banners` | Blocked by `cors` middleware at the top of the stack. Sends error to `errorHandler`. | CORS Error / `500` (JSON) | `500 Internal Server Error` (JSON: `{"error":"Not allowed by CORS"}`) |