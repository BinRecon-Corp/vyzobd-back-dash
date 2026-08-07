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

const router = express.Router();

router.route("/")
  .get(getAllProducts)
  .post(createProduct);

router.route("/:productId/variants")
  .get(getProductVariants)
  .post(createProductVariant);

router.route("/:id")
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

export default router;