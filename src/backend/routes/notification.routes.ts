import express from "express";
import { getNotifications, sendNotification } from "../controllers/notification.controller";
import { requireAuth, requirePermission } from "../middlewares/auth";
import { validateBody } from "../middlewares/validation";
import { sendNotificationSchema } from "../validators/notification.validator";

const router = express.Router();

router.use(requireAuth);
router.get("/", requirePermission("Customers", "read"), getNotifications);
router.post("/send", requirePermission("Customers", "write"), validateBody(sendNotificationSchema), sendNotification);

export default router;
