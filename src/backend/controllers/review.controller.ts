import { Request, Response, NextFunction } from "express";
import { AdminReviewService } from "../services/review.service";
import { AppError } from "../utils/AppError";

export const getReviewStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminReviewService.getStats();
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const listReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminReviewService.listReviews(req.query);
    res.json({ status: "success", data: result });
  } catch (error) {
    next(error);
  }
};

export const getReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await AdminReviewService.getReview(req.params.id);
    res.json({ status: "success", data: review });
  } catch (error) {
    next(error);
  }
};

export const updateReviewStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!["APPROVED", "REJECTED", "HIDDEN"].includes(status)) {
      throw new AppError("Invalid status", 400, "INVALID_STATUS");
    }
    const review = await AdminReviewService.updateStatus(req.params.id, status);
    res.json({ status: "success", data: review, message: "Review status updated" });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await AdminReviewService.deleteReview(req.params.id);
    res.json({ status: "success", message: "Review deleted successfully" });
  } catch (error) {
    next(error);
  }
};
