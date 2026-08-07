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
// import authRouter from "./src/backend/routes/auth.routes";
import analyticsRouter from "./src/backend/routes/analytics.routes";
import productRouter from "./src/backend/routes/product.routes";

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
  // apiRouter.use("/auth", authRouter);
  apiRouter.use("/analytics", analyticsRouter);
  apiRouter.use("/products", productRouter);
  
  app.use("/api/v1", apiRouter);

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
