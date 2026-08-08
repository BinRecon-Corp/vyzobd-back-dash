import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { createServer as createViteServer } from "vite";
import { env } from "./src/backend/config/env";
import { errorHandler } from "./src/backend/middlewares/errorHandler";
import { logger } from "./src/backend/config/logger";
import { swaggerSpec } from "./src/backend/config/swagger";

// Import routers here once created
import authRouter from "./src/backend/routes/auth.routes";
import analyticsRouter from "./src/backend/routes/analytics.routes";
import productRouter from "./src/backend/routes/product.routes";
import categoryRouter from "./src/backend/routes/category.routes";
import brandRouter from "./src/backend/routes/brand.routes";
import attributeRouter from "./src/backend/routes/attribute.routes";
import attributeValueRouter from "./src/backend/routes/attribute-value.routes";
import variantRouter from "./src/backend/routes/variant.routes";
import inventoryRouter from "./src/backend/routes/inventory.routes";
import userRouter from "./src/backend/routes/user.routes";
import roleRouter from "./src/backend/routes/role.routes";
import permissionRouter from "./src/backend/routes/permission.routes";
import auditRouter from "./src/backend/routes/audit.routes";
import sessionRouter from "./src/backend/routes/session.routes";

import storefrontProductRouter from "./src/backend/routes/storefront/product.routes";
import storefrontCategoryRouter from "./src/backend/routes/storefront/category.routes";
import storefrontBrandRouter from "./src/backend/routes/storefront/brand.routes";
import storefrontSearchRouter from "./src/backend/routes/storefront/search.routes";
import storefrontMerchantRouter from "./src/backend/routes/storefront/merchant.routes";
import storefrontSeoRouter from "./src/backend/routes/storefront/seo.routes";
import { storefrontRequestLogger } from "./src/backend/middlewares/storefront/logging.middleware";
import { globalLimiter } from "./src/backend/middlewares/rateLimiter";
import { sanitizeMiddleware } from "./src/backend/middlewares/validation";
import { startRefreshTokenCleanupJob } from "./src/backend/controllers/auth.controller";

async function startServer() {
  const app = express();
  const PORT = 3000; // Required by infrastructure

  // Start automatic refresh token cleanup job (Part 7)
  startRefreshTokenCleanupJob();

  // Part 1 & 10 - Enterprise-grade Helmet security headers config
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.googletagmanager.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        connectSrc: ["'self'", "https:", "http:", "wss:", "ws:"],
        fontSrc: ["'self'", "data:", "https:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameAncestors: ["'self'", "https://*.run.app", "https://ai.studio", "https://*.google.com"], // Allow AI Studio iframe preview
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // COOP
    crossOriginResourcePolicy: { policy: "cross-origin" }, // CORP
    dnsPrefetchControl: { allow: true },
    frameguard: { action: "sameorigin" }, // X-Frame-Options
    hidePoweredBy: true, // Hide X-Powered-By
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }, // Strict-Transport-Security / HSTS
    ieNoOpen: true,
    noSniff: true, // X-Content-Type-Options
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }, // Referrer-Policy
  }));

  // Permissions-Policy & manual frame overrides
  app.use((req, res, next) => {
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });

  // Part 5 - Restricted CORS configuration (Wildcard blocked in production)
  const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(",").map(o => o.trim()) : [];
  if (process.env.APP_URL) {
    allowedOrigins.push(process.env.APP_URL);
  }

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some((allowed) => {
        if (allowed === "*") return true;
        return origin === allowed || origin.startsWith(allowed);
      });
      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked request from origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  const apiRouter = express.Router();

  // Part 2 & Part 4 - Attach Global rate limiting and global recursive input sanitization
  apiRouter.use(globalLimiter);
  apiRouter.use(sanitizeMiddleware);

  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Swagger Documentation
  apiRouter.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  // Mount routes
  apiRouter.use("/auth", authRouter);
  apiRouter.use("/analytics", analyticsRouter);
  apiRouter.use("/products", productRouter);
  apiRouter.use("/categories", categoryRouter);
  apiRouter.use("/brands", brandRouter);
  apiRouter.use("/attributes", attributeRouter);
  apiRouter.use("/attribute-values", attributeValueRouter);
  apiRouter.use("/variants", variantRouter);
  apiRouter.use("/inventory", inventoryRouter);
  apiRouter.use("/users", userRouter);
  apiRouter.use("/roles", roleRouter);
  apiRouter.use("/permissions", permissionRouter);
  apiRouter.use("/audit-logs", auditRouter);
  apiRouter.use("/sessions", sessionRouter);
  
  app.use("/api/v1", apiRouter);

  // Storefront API Routes
  const storefrontRouter = express.Router();
  storefrontRouter.use(storefrontRequestLogger);
  storefrontRouter.use("/products", storefrontProductRouter);
  storefrontRouter.use("/categories", storefrontCategoryRouter);
  storefrontRouter.use("/brands", storefrontBrandRouter);
  storefrontRouter.use("/search", storefrontSearchRouter);
  storefrontRouter.use("/merchant", storefrontMerchantRouter);
  storefrontRouter.use("/seo", storefrontSeoRouter);
  
  app.use("/api/storefront/v1", storefrontRouter);

  // Error handling middleware (must be registered after routes)
  app.use(errorHandler);

  // Vite middleware for development
  if (env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Since this is Express v4, we use *
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
