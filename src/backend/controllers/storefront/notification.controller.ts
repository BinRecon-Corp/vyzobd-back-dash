import { Response, NextFunction } from "express";
import { CustomerAuthRequest } from "../../middlewares/customerAuth";
import { StorefrontNotificationService } from "../../services/storefront/notification.service";

export const getNotifications = async (req: CustomerAuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customer!.id;
    const { page, limit } = req.query;
    
    const result = await StorefrontNotificationService.getNotifications(customerId, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req: CustomerAuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customer!.id;
    const count = await StorefrontNotificationService.getUnreadCount(customerId);
    res.status(200).json({ status: "success", data: { count } });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: CustomerAuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customer!.id;
    const { id } = req.params;
    await StorefrontNotificationService.markAsRead(customerId, id);
    res.status(200).json({ status: "success", message: "Notification marked as read" });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: CustomerAuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerId = req.customer!.id;
    await StorefrontNotificationService.markAllAsRead(customerId);
    res.status(200).json({ status: "success", message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
};
