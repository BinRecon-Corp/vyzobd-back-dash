import express from "express";
import {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  toggleCouponActive,
  duplicateCoupon,
  deleteCoupon,
  validateCoupon,
} from "../controllers/coupon.controller";
import { requireAuth, requirePermission } from "../middlewares/auth";

const router = express.Router();

// Public validation route for checkout
router.post("/validate", validateCoupon);

// Admin protected routes
router.use(requireAuth);

router.route("/")
  .get(requirePermission("Coupons", "read"), getAllCoupons)
  .post(requirePermission("Coupons", "write"), createCoupon);

router.route("/:id")
  .get(requirePermission("Coupons", "read"), getCouponById)
  .put(requirePermission("Coupons", "write"), updateCoupon)
  .delete(requirePermission("Coupons", "delete"), deleteCoupon);

router.patch("/:id/toggle", requirePermission("Coupons", "write"), toggleCouponActive);
router.post("/:id/duplicate", requirePermission("Coupons", "write"), duplicateCoupon);

export default router;
