import { Response, NextFunction } from "express";
import { CustomerAuthRequest } from "../../middlewares/customerAuth";
import { StorefrontShipmentService } from "../../services/storefront/shipment.service";

export const getMyShipments = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.customer!.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const status = req.query.status as string | undefined;

    const result = await StorefrontShipmentService.getCustomerShipments(customerId, {
      page,
      limit,
      status,
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderShipments = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.customer!.id;
    const orderId = req.params.orderId || req.params.id;

    const result = await StorefrontShipmentService.getOrderShipments(customerId, orderId);

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderTracking = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.customer!.id;
    const orderId = req.params.orderId || req.params.id;

    const result = await StorefrontShipmentService.getOrderTracking(customerId, orderId);

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
