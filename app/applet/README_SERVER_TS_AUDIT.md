# server.ts Audit

A comprehensive review of the `server.ts` file reveals the architectural choices and structural flaws leading to the observed API behavior.

## What is Configured Correctly
1. **CORS Restrictions**: The application correctly configures the `cors` middleware to parse allowed origins and selectively reject unauthorized cross-origin requests.
2. **Route Modularity**: The `apiRouter` and `storefrontRouter` are properly separated, mapped to their correct base paths (`/api/v1` and `/api/storefront/v1`), and properly import modular route files.
3. **Error Handler Structure**: A global `errorHandler` middleware is properly placed after the API route registrations, ensuring that synchronous errors thrown by the API are caught. It correctly checks for the `isStorefront` boolean to prevent leaking internal stack traces to the public frontend.
4. **SPA Middleware Fallback**: The Vite middleware (for dev) and Express static file serving (for prod) are correctly configured as the final catch-all step (`app.get('*')`) to serve the single-page application.

## Critical Flaws and Missing Elements
1. **Lack of Async Error Handling (Express 4 limitation)**:
   - The application relies on Express 4, which does not automatically catch errors thrown inside `async` route handlers.
   - The controllers (e.g., `getBanners`) are heavily asynchronous (`await storefrontContentService...`), but they lack internal `try/catch` blocks.
   - The `express-async-errors` module (or a custom `asyncHandler` wrapper) is completely missing from the project.
   - **Impact**: Any asynchronous failure (like a Prisma database connection error) causes the Node process to crash or the HTTP request to hang silently, rather than returning a proper `500` JSON error via the `errorHandler`.

2. **Missing API Route Boundary (No API 404 Handler)**:
   - There is no hard boundary separating API traffic from frontend traffic when an endpoint is unmatched.
   - If a request begins with `/api` but fails to match a registered route or uses the wrong HTTP method, it falls through the API layer entirely and hits the SPA frontend catch-all handler.
   - **Impact**: API clients receive the React frontend's HTML payload instead of a JSON `404 Not Found` response, breaking JSON parsers.

## Required Fixes
To resolve these issues, the following code should be added to `server.ts`:
1. Use an async wrapper or install `express-async-errors` so that rejected promises flow into `next(err)`.
2. Add an explicit API 404 block directly before the `errorHandler`:
   ```typescript
   app.use("/api", (req, res) => {
     res.status(404).json({ status: "error", message: "Route not found" });
   });
   ```