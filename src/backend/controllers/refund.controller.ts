import { Response, NextFunction } from "express";
import { AdminRefundService } from "../services/refund.service";

export const processRefund = async (
  req: any, // or AdminAuthRequest if you have one
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { approve, providerReference } = req.body;

    const refund = await AdminRefundService.processRefund(id, approve, providerReference);

    res.status(200).json({
      status: "success",
      message: "Refund processed successfully",
      data: { refund },
    });
  } catch (error) {
    next(error);
  }
};

export const initiateRefund = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId, paymentId, amount, reason } = req.body;

    const refund = await AdminRefundService.initiateAdminRefund(orderId, paymentId, amount, reason);

    res.status(201).json({
      status: "success",
      message: "Refund initiated successfully",
      data: { refund },
    });
  } catch (error) {
    next(error);
  }
};
