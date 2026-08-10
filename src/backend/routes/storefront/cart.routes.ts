import express from "express";
import {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../../controllers/storefront/cart.controller";
import { requireCustomerAuth } from "../../middlewares/customerAuth";
import { validateBody, validateParamsUUID } from "../../middlewares/validation";
import { addCartItemSchema, updateCartItemSchema } from "../../validators/cart.validator";

const router = express.Router();

router.use(requireCustomerAuth);

router.get("/", getCart);
router.post("/items", validateBody(addCartItemSchema), addItemToCart);
router.put("/items/:id", validateParamsUUID(["id"]), validateBody(updateCartItemSchema), updateCartItem);
router.delete("/items/:id", validateParamsUUID(["id"]), removeCartItem);
router.delete("/", clearCart);

export default router;
