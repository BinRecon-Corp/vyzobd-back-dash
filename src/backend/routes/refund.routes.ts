import express from "express";
import { processRefund, initiateRefund } from "../controllers/refund.controller";
import { requireAuth, requirePermission } from "../middlewares/auth";
import { validateBody, validateParamsUUID } from "../middlewares/validation";
import { adminProcessRefundSchema, adminInitiateRefundSchema } from "../validators/refund.validator";

const router = express.Router();

router.use(requireAuth);

router.post(
  "/initiate",
  requirePermission("Orders", "write"), // Assuming Refunds follow Order permissions
  validateBody(adminInitiateRefundSchema),
  initiateRefund
);

router.post(
  "/:id/process",
  requirePermission("Orders", "write"),
  validateParamsUUID(["id"]),
  validateBody(adminProcessRefundSchema),
  processRefund
);

export default router;
