import express from "express";
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from "../controllers/role.controller";
import { updateRolePermissions } from "../controllers/permission.controller";
import { requireAuth, requirePermission, requireSuperAdmin } from "../middlewares/auth";

const router = express.Router();

router.use(requireAuth);

router.route("/")
  .get(requirePermission("Roles", "read"), getAllRoles)
  .post(requireSuperAdmin, createRole);

router.route("/:id")
  .get(requirePermission("Roles", "read"), getRoleById)
  .put(requireSuperAdmin, updateRole)
  .delete(requireSuperAdmin, deleteRole);

router.patch("/:id/permissions", requireSuperAdmin, updateRolePermissions);

export default router;
