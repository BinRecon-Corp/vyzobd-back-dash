import express from "express";
import { getPublicSettings } from "../../controllers/storefront/setting.controller";
import { publicLimiter } from "../../middlewares/rateLimiter";

const router = express.Router();

router.get("/", publicLimiter, getPublicSettings);
router.get("/public", publicLimiter, getPublicSettings);

export default router;
