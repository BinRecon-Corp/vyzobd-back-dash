import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
  updateUserRole,
  adminResetPassword,
} from "../controllers/user.controller";
import { requireAuth, requirePermission, requireSuperAdmin } from "../middlewares/auth";
import {
  validateBody,
  validateQuery,
  validateParamsUUID,
  createUserSchema,
  updateUserSchema,
  querySchema,
} from "../middlewares/validation";

const router = express.Router();

router.use(requireAuth);

router.route("/")
  .get(requirePermission("Users", "read"), validateQuery(querySchema), getAllUsers)
  .post(requireSuperAdmin, validateBody(createUserSchema), createUser);

router.route("/:id")
  .get(requirePermission("Users", "read"), validateParamsUUID(["id"]), getUserById)
  .put(requirePermission("Users", "write"), validateParamsUUID(["id"]), validateBody(updateUserSchema), updateUser)
  .delete(requireSuperAdmin, validateParamsUUID(["id"]), deleteUser);

router.patch("/:id/status", requirePermission("Users", "write"), validateParamsUUID(["id"]), updateUserStatus);
router.patch("/:id/role", requireSuperAdmin, validateParamsUUID(["id"]), updateUserRole);
router.patch("/:id/reset-password", requirePermission("Users", "write"), validateParamsUUID(["id"]), adminResetPassword);

export default router;
