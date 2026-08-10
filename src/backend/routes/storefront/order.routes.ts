import express from "express";
import {
  getMyOrders,
  getMyOrderById,
  getMyOrderTimeline,
} from "../../controllers/storefront/order.controller";
import { requireCustomerAuth } from "../../middlewares/customerAuth";
import { validateParamsUUID } from "../../middlewares/validation";

const router = express.Router();

router.use(requireCustomerAuth);

router.get("/", getMyOrders);
router.get("/:id", validateParamsUUID(["id"]), getMyOrderById);
router.get("/:id/timeline", validateParamsUUID(["id"]), getMyOrderTimeline);

export default router;
