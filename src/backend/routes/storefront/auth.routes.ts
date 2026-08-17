import { z } from "zod";
import express from "express";
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
} from "../../controllers/storefront/auth.controller";
import { getMyProfile } from "../../controllers/storefront/account.controller";
import { requireCustomerAuth } from "../../middlewares/customerAuth";
import {
  loginLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  registerLimiter,
  verifyEmailLimiter,
  resendVerificationLimiter,
} from "../../middlewares/rateLimiter";
import { validateBody } from "../../middlewares/validation";
import {
  customerRegisterSchema,
  customerLoginSchema,
  customerForgotPasswordSchema,
  customerResetPasswordSchema,
} from "../../validators/storefront-auth.validator";

const router = express.Router();

router.post("/register", registerLimiter, validateBody(customerRegisterSchema), register);
router.post("/login", loginLimiter, validateBody(customerLoginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", requireCustomerAuth, logout);

// Profile and session inspection endpoints for storefront client compatibility
router.get("/me", requireCustomerAuth, getMyProfile);
router.get("/profile", requireCustomerAuth, getMyProfile);

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validateBody(customerForgotPasswordSchema),
  forgotPassword
);

router.post(
  "/reset-password",
  resetPasswordLimiter,
  validateBody(customerResetPasswordSchema),
  resetPassword
);

router.post("/verify-email", verifyEmailLimiter, verifyEmail);

router.post("/resend-verification", resendVerificationLimiter, validateBody(z.object({ email: z.string().email() })), resendVerificationEmail);

export default router;
