import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { AuditService } from "../services/audit.service";

const createLimiter = (max: number, minutes: number, actionName: string) => {
  return rateLimit({
    windowMs: minutes * 60 * 1000,
    max,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: async (req: Request, res: Response) => {
      const ip = (req.headers["x-forwarded-for"] as string) || req.ip || req.socket.remoteAddress || "Unknown";
      
      console.warn(`[RATE_LIMIT] ${actionName} rate limit exceeded by IP: ${ip}`);

      try {
        await AuditService.createLog(
          null,
          "RATE_LIMIT_EXCEEDED",
          "Security",
          null,
          null,
          {
            action: actionName,
            path: req.originalUrl || req.path,
            ipAddress: ip,
            userAgent: req.headers["user-agent"] || null,
          },
          req
        );
      } catch (err) {
        console.error("Failed to log rate limit exceeded:", err);
      }

      res.status(429).json({
        status: "fail",
        error: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests from this IP, please try again later."
      });
    }
  });
};

export const loginLimiter = createLimiter(5, 1, "LOGIN_ATTEMPT");
export const forgotPasswordLimiter = createLimiter(5, 1, "FORGOT_PASSWORD_ATTEMPT");
export const resetPasswordLimiter = createLimiter(10, 1, "RESET_PASSWORD_ATTEMPT");
export const globalLimiter = createLimiter(100, 1, "GLOBAL_API_ATTEMPT");
