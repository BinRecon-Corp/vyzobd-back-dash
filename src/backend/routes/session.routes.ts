import express from "express";
import {
  getActiveSessions,
  revokeSession
} from "../controllers/session.controller";
import { requireAuth, requireSuperAdmin } from "../middlewares/auth";

const router = express.Router();

router.use(requireAuth);

router.get("/", requireSuperAdmin, getActiveSessions);
router.delete("/:id", requireSuperAdmin, revokeSession);

export default router;
