import { Router } from "express";
import { requireAuth, AuthRequest } from "../middlewares/auth";
import {
  getAllAuditLogs,
  getAuditLogById,
  exportAuditLogs,
} from "../controllers/audit.controller";
import { Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

const router = Router();

const requireAuditAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError("User not authenticated", 401, "UNAUTHORIZED"));
  }
  const allowedRoles = ["SuperAdmin", "Admin", "Viewer"];
  if (!allowedRoles.includes(req.user.roleName)) {
    return next(new AppError("Access denied: insufficient permissions to view audit logs", 403, "FORBIDDEN"));
  }
  next();
};

router.use(requireAuth);
router.use(requireAuditAccess);

// Place /export before /:id to prevent routing clash
router.get("/export", exportAuditLogs);
router.get("/", getAllAuditLogs);
router.get("/:id", getAuditLogById);

export default router;
