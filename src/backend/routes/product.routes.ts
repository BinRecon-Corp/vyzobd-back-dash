import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller";
import {
  getProductVariants,
  createProductVariant
} from "../controllers/variant.controller";
import { requireAuth, requirePermission } from "../middlewares/auth";

const router = express.Router();

router.use(requireAuth);

router.route("/")
  .get(requirePermission("Products", "read"), getAllProducts)
  .post(requirePermission("Products", "write"), createProduct);

router.route("/:productId/variants")
  .get(requirePermission("Products", "read"), getProductVariants)
  .post(requirePermission("Products", "write"), createProductVariant);

router.route("/:id")
  .get(requirePermission("Products", "read"), getProductById)
  .put(requirePermission("Products", "write"), updateProduct)
  .delete(requirePermission("Products", "delete"), deleteProduct);

export default router;