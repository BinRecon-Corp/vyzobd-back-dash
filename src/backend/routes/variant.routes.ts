import express from "express";
import {
  getVariantById,
  updateVariant,
  deleteVariant,
} from "../controllers/variant.controller";

const router = express.Router();

router.route("/:id")
  .get(getVariantById)
  .put(updateVariant)
  .delete(deleteVariant);

export default router;
