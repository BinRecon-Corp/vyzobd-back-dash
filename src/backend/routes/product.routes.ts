import express from "express";
import multer from "multer";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  deleteProductImage,
  reorderProductImages,
  setPrimaryProductImage,
} from "../controllers/product.controller";
import {
  getProductVariants,
  createProductVariant
} from "../controllers/variant.controller";
import { requireAuth, requirePermission } from "../middlewares/auth";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.use(requireAuth);

router.route("/")
  .get(requirePermission("Products", "read"), getAllProducts)
  .post(requirePermission("Products", "write"), createProduct);

router.route("/:productId/variants")
  .get(requirePermission("Products", "read"), getProductVariants)
  .post(requirePermission("Products", "write"), createProductVariant);

// Product Media Routes
router.post("/:id/images", requirePermission("Products", "write"), upload.single("image"), uploadProductImage);
router.delete("/:id/images/:imageId", requirePermission("Products", "write"), deleteProductImage);
router.put("/:id/images/reorder", requirePermission("Products", "write"), reorderProductImages);
router.put("/:id/images/:imageId/primary", requirePermission("Products", "write"), setPrimaryProductImage);

router.route("/:id")
  .get(requirePermission("Products", "read"), getProductById)
  .put(requirePermission("Products", "write"), updateProduct)
  .delete(requirePermission("Products", "delete"), deleteProduct);

export default router;