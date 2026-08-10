import { Response, NextFunction } from "express";
import { CustomerAuthRequest } from "../../middlewares/customerAuth";
import { StorefrontCheckoutService } from "../../services/storefront/checkout.service";

/**
 * GET /api/storefront/v1/checkout/session
 * Retrieves current checkout session totals, items, and address setups.
 */
export const getCheckoutSession = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.customer!.id;
    const session = await StorefrontCheckoutService.getCheckoutSession(customerId);

    res.status(200).json({
      status: "success",
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/storefront/v1/checkout/coupon
 * Applies a coupon to the active checkout session.
 */
export const applyCoupon = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.customer!.id;
    const { couponCode } = req.body;

    const session = await StorefrontCheckoutService.applyCoupon(customerId, couponCode);

    res.status(200).json({
      status: "success",
      message: "Coupon applied successfully",
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/storefront/v1/checkout/shipping
 * Updates shipping and billing address selections.
 */
export const updateAddresses = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.customer!.id;
    const { shippingAddressId, billingAddressId } = req.body;

    const session = await StorefrontCheckoutService.updateAddresses(
      customerId,
      shippingAddressId,
      billingAddressId
    );

    res.status(200).json({
      status: "success",
      message: "Addresses selected successfully",
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/storefront/v1/checkout/complete
 * Executes checkout transaction and creates an Order.
 */
export const completeCheckout = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.customer!.id;
    const { paymentMethod } = req.body;

    const order = await StorefrontCheckoutService.completeCheckout(customerId, paymentMethod);

    res.status(201).json({
      status: "success",
      message: "Order placed successfully",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};
