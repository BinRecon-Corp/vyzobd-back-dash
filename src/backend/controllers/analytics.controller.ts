import { Response, NextFunction } from "express";
import { AdminAnalyticsService } from "../services/analytics.service";

export const getOverview = async (req: any, res: Response, next: NextFunction) => {
  try {
    const result = await AdminAnalyticsService.getOverview();
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (req: any, res: Response, next: NextFunction) => {
  try {
    const result = await AdminAnalyticsService.getCustomerAnalytics();
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (req: any, res: Response, next: NextFunction) => {
  try {
    const result = await AdminAnalyticsService.getProductAnalytics();
    res.status(200).json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};
