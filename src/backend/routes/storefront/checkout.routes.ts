import express from "express";
import {
  getCheckoutSession,
  applyCoupon,
  updateAddresses,
  completeCheckout,
} from "../../controllers/storefront/checkout.controller";
import { requireCustomerAuth } from "../../middlewares/customerAuth";
import { validateBody } from "../../middlewares/validation";
import {
  applyCouponSchema,
  updateShippingSchema,
  completeCheckoutSchema,
} from "../../validators/checkout.validator";

const router = express.Router();

router.use(requireCustomerAuth);

// Handles both GET /session and POST /session as specified in guidelines
router.get("/session", getCheckoutSession);
router.post("/session", getCheckoutSession);

router.post("/coupon", validateBody(applyCouponSchema), applyCoupon);
router.post("/shipping", validateBody(updateShippingSchema), updateAddresses);
router.post("/complete", validateBody(completeCheckoutSchema), completeCheckout);

export default router;
