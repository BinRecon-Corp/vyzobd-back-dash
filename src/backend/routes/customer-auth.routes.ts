import express from "express";
import { register, login, logout, googleAuth, facebookAuth, forgotPassword, resetPassword, verifyEmail } from "../controllers/customer-auth.controller";
import { validateBody } from "../middlewares/validation";
import { customerRegisterSchema, customerLoginSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema } from "../validators/customer-auth.validator";
import { requireCustomerAuth } from "../middlewares/customerAuth";
import { loginLimiter } from "../middlewares/rateLimiter";

const router = express.Router();

router.post("/register", validateBody(customerRegisterSchema), register);
router.post("/login", loginLimiter, validateBody(customerLoginSchema), login);
router.post("/logout", requireCustomerAuth, logout);
router.post("/google", googleAuth);
router.post("/facebook", facebookAuth);
router.post("/forgot-password", validateBody(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validateBody(resetPasswordSchema), resetPassword);
router.post("/verify-email", validateBody(verifyEmailSchema), verifyEmail);

export default router;
