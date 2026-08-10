import { Response, NextFunction } from "express";
import { CustomerAuthRequest } from "../../middlewares/customerAuth";
import { StorefrontCartService } from "../../services/storefront/cart.service";

export const getCart = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.customer!.id;
    const cart = await StorefrontCartService.getCart(customerId);

    res.status(200).json({
      status: "success",
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

export const addItemToCart = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.customer!.id;
    const { productId, variantId, quantity } = req.body;

    const cart = await StorefrontCartService.addItem(customerId, {
      productId,
      variantId,
      quantity,
    });

    res.status(200).json({
      status: "success",
      message: "Item added to cart successfully",
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.customer!.id;
    const { id } = req.params;
    const { quantity } = req.body;

    const cart = await StorefrontCartService.updateItem(customerId, id, quantity);

    res.status(200).json({
      status: "success",
      message: "Cart item updated successfully",
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

export const removeCartItem = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.customer!.id;
    const { id } = req.params;

    const cart = await StorefrontCartService.removeItem(customerId, id);

    res.status(200).json({
      status: "success",
      message: "Item removed from cart successfully",
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.customer!.id;
    const cart = await StorefrontCartService.clearCart(customerId);

    res.status(200).json({
      status: "success",
      message: "Cart cleared successfully",
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};
