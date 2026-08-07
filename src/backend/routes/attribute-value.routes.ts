import express from "express";
import {
  createAttributeValue,
  updateAttributeValue,
  deleteAttributeValue,
} from "../controllers/attribute-value.controller";

const router = express.Router();

router.route("/")
  .post(createAttributeValue);

router.route("/:id")
  .put(updateAttributeValue)
  .delete(deleteAttributeValue);

export default router;
