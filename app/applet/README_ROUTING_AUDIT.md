# Express Routing Audit

An audit of the Storefront Express routing configuration reveals the following:

## Route Registration
- **Admin API**: Mounted at `/api/v1` via `apiRouter`.
- **Storefront API**: Mounted at `/api/storefront/v1` via `storefrontRouter`.
- The Storefront routes are properly structured in `server.ts`. For example, `storefrontRouter.use("/banners", storefrontBannerRouter)` correctly delegates to the banner routes.
- Inside `banner.routes.ts`, the router correctly exposes `router.get("/", getBanners)`.
- If the exact URL and HTTP method are matched (`GET /api/storefront/v1/banners`), the router correctly invokes the controller.

## The Routing Fallthrough Issue
- When an API request does **not** match a registered route (e.g., due to a typo in the URL path or an incorrect HTTP method like `POST`), Express continues down the middleware stack looking for a match.
- Because there is no dedicated `404 Not Found` handler strictly scoped to the `/api/*` path, the request passes right through the API layer.
- It also bypasses the `errorHandler` middleware (because no actual error was thrown; it's simply a non-match).
- Finally, the request hits the catch-all wildcard `app.get('*')` (in production) or `vite.middlewares` (in development), which is designed to support the React SPA's client-side routing.
- This wildcard handler indiscriminately serves the `index.html` frontend file with a `200 OK` status, causing API clients to receive HTML instead of a standard `404 Not Found` JSON payload.

## Recommendation
A dedicated API 404 handler must be added in `server.ts` immediately after the API routers and before the `errorHandler` and SPA fallback:

```typescript
// 404 handler for API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    status: "error",
    message: `API route not found: ${req.method} ${req.originalUrl}`,
    errors: []
  });
});
```