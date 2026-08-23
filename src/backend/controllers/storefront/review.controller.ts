import { Request, Response, NextFunction } from "express";
import { StorefrontReviewService } from "../../services/storefront/review.service";



export const getFeaturedReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const result = await StorefrontReviewService.getFeaturedReviews(limit);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const getProductReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    
    const result = await StorefrontReviewService.getProductReviews(productId, page, limit);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const checkEligibility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const { mobile } = req.body;
    
    if (!mobile) {
      return res.status(400).json({ status: "error", code: "MOBILE_REQUIRED", message: "Mobile number is required" });
    }

    const result = await StorefrontReviewService.checkEligibility(productId, mobile);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const submitReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const customerId = (req as any).user?.id; // If authenticated

    const payload = {
      productId,
      ...req.body
    };

    const review = await StorefrontReviewService.submitReview(payload, customerId);
    res.status(201).json({ status: "success", data: review, message: "Review submitted successfully and is pending approval" });
  } catch (error) {
    next(error);
  }
};
