import { Router } from "express";
import { 
  trackServerPurchase,
  getOverviewMetrics,
  getRevenueMetrics,
  getOrdersMetrics,
  getProductsMetrics,
  getCategoryMetrics,
  getBrandMetrics,
  getGa4Metrics
} from "../controllers/analytics.controller";
import { requireAuth, requirePermission } from "../middlewares/auth";

const router = Router();

router.use(requireAuth);

router.post("/track-purchase", requirePermission("Analytics", "write"), trackServerPurchase);

router.get("/overview", requirePermission("Analytics", "read"), getOverviewMetrics);
router.get("/revenue", requirePermission("Analytics", "read"), getRevenueMetrics);
router.get("/orders", requirePermission("Analytics", "read"), getOrdersMetrics);
router.get("/products", requirePermission("Analytics", "read"), getProductsMetrics);
router.get("/categories", requirePermission("Analytics", "read"), getCategoryMetrics);
router.get("/brands", requirePermission("Analytics", "read"), getBrandMetrics);
router.get("/ga4", requirePermission("Analytics", "read"), getGa4Metrics);

export default router;
