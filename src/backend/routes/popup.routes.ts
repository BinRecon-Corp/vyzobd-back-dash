import express from "express";
import {
  getAllPopups,
  getPopupById,
  createPopup,
  updatePopup,
  deletePopup,
} from "../controllers/popup.controller";
import { requireAuth, requirePermission } from "../middlewares/auth";

const router = express.Router();

// Public active popups
router.get("/public", getAllPopups);

// Admin routes
router.use(requireAuth);

router.route("/")
  .get(requirePermission("Banners", "read"), getAllPopups)
  .post(requirePermission("Banners", "write"), createPopup);

router.route("/:id")
  .get(requirePermission("Banners", "read"), getPopupById)
  .put(requirePermission("Banners", "write"), updatePopup)
  .delete(requirePermission("Banners", "delete"), deletePopup);

export default router;
