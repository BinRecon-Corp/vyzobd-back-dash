import { Response, NextFunction } from "express";
import { CustomerAuthRequest } from "../../middlewares/customerAuth";
import { StorefrontRefundService } from "../../services/storefront/refund.service";

export const requestRefund = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.customer!.id;
    const { orderId, reason, amount } = req.body;

    const refund = await StorefrontRefundService.requestRefund(customerId, orderId, reason, amount);

    res.status(201).json({
      status: "success",
      message: "Refund requested successfully",
      data: { refund },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyRefunds = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.customer!.id;
    const refunds = await StorefrontRefundService.getCustomerRefunds(customerId);

    res.status(200).json({
      status: "success",
      data: { refunds },
    });
  } catch (error) {
    next(error);
  }
};
