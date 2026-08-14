# Proxy & Architecture Audit (Apache vs. AI Studio)

## Previous Environment (Apache VirtualHost)
In the user's previous environment, they likely utilized an Apache web server configured with explicit `ProxyPass` and `ProxyPassReverse` directives. In such a setup, Apache acts as a reverse proxy:
- Traffic matching `/api/*` is specifically forwarded to the backend Node.js Express process. If the Node.js backend fails or the route does not exist, Apache (or Node itself) handles it within the context of an API response, often returning standard `502 Bad Gateway` or `404 Not Found` HTTP errors.
- The React SPA is likely served by Apache as static files directly from the file system, or via a separate VirtualHost routing mechanism.

## Current Environment (AI Studio Node.js Container)
In the AI Studio environment, the architecture is simplified into a unified, single-container full-stack application:
- There is no separate Apache layer acting as a traffic controller.
- The Node.js Express application (`server.ts`) acts as both the backend API server and the frontend static file server (using `express.static` and `vite.middlewares`).
- NGINX is used by the AI Studio infrastructure simply to route external traffic on port `443` to the container's hardcoded port `3000`. NGINX does not inspect or split traffic between `/api` and `/` — it blindly forwards all traffic to the Node application.

## Conclusion
Apache is no longer sending storefront API requests to either the Node backend or the React frontend, because Apache is not present in this stack. All requests (both API and static frontend assets) hit the Node.js Express application on port 3000. It is solely the responsibility of the Express routing configuration (`server.ts`) to distinguish between API endpoints (which should return JSON) and frontend routes (which should serve the SPA's HTML).