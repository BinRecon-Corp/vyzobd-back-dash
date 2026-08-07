import express from "express";
import {
  getAllAttributes,
  getAttributeById,
  createAttribute,
  updateAttribute,
  deleteAttribute,
} from "../controllers/attribute.controller";

const router = express.Router();

router.route("/")
  .get(getAllAttributes)
  .post(createAttribute);

router.route("/:id")
  .get(getAttributeById)
  .put(updateAttribute)
  .delete(deleteAttribute);

export default router;
