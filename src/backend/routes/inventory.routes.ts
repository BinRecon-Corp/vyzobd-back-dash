import express from "express";
import {
  getLowStock,
  getOutOfStock,
  getInventoryValue,
  getAllInventory
} from "../controllers/inventory.controller";

const router = express.Router();

router.get("/low-stock", getLowStock);
router.get("/out-of-stock", getOutOfStock);
router.get("/value", getInventoryValue);
router.get("/", getAllInventory);

export default router;
