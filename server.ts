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

import storefrontProductRouter from "./src/backend/routes/storefront/product.routes";
import storefrontCategoryRouter from "./src/backend/routes/storefront/category.routes";
import storefrontBrandRouter from "./src/backend/routes/storefront/brand.routes";
import storefrontSearchRouter from "./src/backend/routes/storefront/search.routes";
import storefrontMerchantRouter from "./src/backend/routes/storefront/merchant.routes";
import storefrontSeoRouter from "./src/backend/routes/storefront/seo.routes";
import { storefrontRequestLogger } from "./src/backend/middlewares/storefront/logging.middleware";

async function startServer() {
  const app = express();
  const PORT = 3000; // Required by infrastructure

  // Middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled for Vite development
  }));
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  const apiRouter = express.Router();
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
