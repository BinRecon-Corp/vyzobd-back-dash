import express from "express";
import { getReturns, approveReturn, rejectReturn, receiveReturn } from "../controllers/return.controller";
import { requireAuth, requirePermission } from "../middlewares/auth";
import { validateBody, validateParamsUUID } from "../middlewares/validation";
import { adminProcessReturnSchema } from "../validators/return.validator";

const router = express.Router();

router.use(requireAuth);

router.get("/", requirePermission("Orders", "read"), getReturns);
router.post("/:id/approve", requirePermission("Orders", "write"), validateParamsUUID(["id"]), validateBody(adminProcessReturnSchema), approveReturn);
router.post("/:id/reject", requirePermission("Orders", "write"), validateParamsUUID(["id"]), validateBody(adminProcessReturnSchema), rejectReturn);
router.post("/:id/receive", requirePermission("Orders", "write"), validateParamsUUID(["id"]), validateBody(adminProcessReturnSchema), receiveReturn);

export default router;
