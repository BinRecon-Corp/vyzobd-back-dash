import express from "express";
import {
  getAllCategories,
  getCategoryById,
  getCategoryBreadcrumb,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";

const router = express.Router();

router.route("/")
  .get(getAllCategories)
  .post(createCategory);

router.get("/:id/breadcrumb", getCategoryBreadcrumb);

router.route("/:id")
  .get(getCategoryById)
  .put(updateCategory)
  .delete(deleteCategory);

export default router;
