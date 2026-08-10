import { Response, NextFunction } from "express";
import { CustomerAuthRequest } from "../../middlewares/customerAuth";
import { StorefrontOrderService } from "../../services/storefront/order.service";

export const getMyOrders = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.customer!.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const status = req.query.status as string | undefined;

    const result = await StorefrontOrderService.getCustomerOrders(customerId, {
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

export const getMyOrderById = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.customer!.id;
    const { id } = req.params;

    const order = await StorefrontOrderService.getCustomerOrderById(customerId, id);

    res.status(200).json({
      status: "success",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrderTimeline = async (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId = req.customer!.id;
    const { id } = req.params;

    const timelineData = await StorefrontOrderService.getCustomerOrderTimeline(customerId, id);

    res.status(200).json({
      status: "success",
      data: timelineData,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrderShipments = async (req: CustomerAuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customer!.id;
    const { id } = req.params;
    const shipments = await StorefrontOrderService.getOrderShipments(customerId, id);
    res.status(200).json({ status: "success", data: { shipments } });
  } catch (error) {
    next(error);
  }
};
