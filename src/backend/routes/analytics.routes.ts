import express from "express";
import { getOverview, getCustomers, getProducts } from "../controllers/analytics.controller";
import { requireAuth, requirePermission } from "../middlewares/auth";

const router = express.Router();

router.use(requireAuth);
router.get("/overview", requirePermission("Orders", "read"), getOverview);
router.get("/customers", requirePermission("Customers", "read"), getCustomers);
router.get("/products", requirePermission("Products", "read"), getProducts);

export default router;
