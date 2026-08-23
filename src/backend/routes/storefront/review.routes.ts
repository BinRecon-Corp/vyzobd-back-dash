import { Router } from "express";
import { getProductReviews, checkEligibility, submitReview, getFeaturedReviews } from "../../controllers/storefront/review.controller";
import { validateBody } from "../../middlewares/validation";
import { createReviewSchema, getFeaturedReviewsQuerySchema } from "../../validators/review.validator";
import { validateQuery } from "../../middlewares/validation";

const router = Router();

// Publicly accessible
router.get("/featured", validateQuery(getFeaturedReviewsQuerySchema), getFeaturedReviews);

router.get("/:productId", getProductReviews);

// Action endpoints (can be public guest or authenticated, mobile number is verified)
router.post("/:productId/eligibility", checkEligibility);
router.post("/:productId", validateBody(createReviewSchema.omit({ productId: true })), submitReview);

export default router;
