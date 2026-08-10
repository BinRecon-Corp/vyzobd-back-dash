import express from "express";
import { getPublicSettings } from "../../controllers/storefront/setting.controller";

const router = express.Router();

router.get("/public", getPublicSettings);

export default router;
