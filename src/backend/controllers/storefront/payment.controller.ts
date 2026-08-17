import { Response, NextFunction, Request } from "express";
import { CustomerAuthRequest } from "../../middlewares/customerAuth";
import { StorefrontPaymentService } from "../../services/storefront/payment.service";

/**
 * POST /api/storefront/v1/payment/initiate
 */
export const initiatePayment = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.customer!.id;
    const { orderId, provider } = req.body;

    const result = await StorefrontPaymentService.initiatePayment(customerId, orderId, provider);

    res.status(200).json({
      status: "success",
      message: "Payment initiated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/storefront/v1/payment/:id
 */
export const getPaymentStatus = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.customer!.id;
    const paymentId = req.params.id;

    const payment = await StorefrontPaymentService.getPaymentStatus(customerId, paymentId);

    res.status(200).json({
      status: "success",
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/storefront/v1/payment/verify
 */
export const verifyPayment = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.customer!.id;
    const { paymentId, providerTransactionId } = req.body;

    const payment = await StorefrontPaymentService.verifyPayment(customerId, paymentId, providerTransactionId);

    res.status(200).json({
      status: "success",
      message: "Payment verification completed",
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/storefront/v1/payment/webhook/:provider
 */
export const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const provider = req.params.provider.toUpperCase();
    const payload = req.body;
    const signature = req.headers["x-signature"] as string | undefined;

    const result = await StorefrontPaymentService.handleWebhook(provider, payload, signature);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
