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

const router = Router();

router.post("/track-purchase", trackServerPurchase);

router.get("/overview", getOverviewMetrics);
router.get("/revenue", getRevenueMetrics);
router.get("/orders", getOrdersMetrics);
router.get("/products", getProductsMetrics);
router.get("/categories", getCategoryMetrics);
router.get("/brands", getBrandMetrics);
router.get("/ga4", getGa4Metrics);

export default router;
