import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err);

  const isStorefront = req.originalUrl.startsWith("/api/storefront");

  if (isStorefront) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        details: ((err as any).errors || (err as any).issues || []).map((e: any) => ({
          field: e.path.join("."),
          message: e.message,
        }))
      });
    }

    // Never expose internal errors for storefront
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: ((err as any).errors || (err as any).issues || []).map((e: any) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
    });
  }

  const isProd = process.env.NODE_ENV === "production";

  // Part 11 - Error Handling & Obfuscation for Database (Prisma/SQL), JWT, Paths
  let statusCode = err.statusCode || 500;
  let code = err.code || "INTERNAL_SERVER_ERROR";
  let message = err.message || "Internal Server Error";

  const isPrismaError = 
    err.name?.includes("Prisma") || 
    err.message?.includes("prisma") || 
    err.code?.startsWith("P20") || 
    err.message?.toLowerCase().includes("select ") ||
    err.message?.toLowerCase().includes("insert into") ||
    err.message?.toLowerCase().includes("sqlite");

  const isJwtError = 
    err.name?.includes("JsonWebTokenError") || 
    err.name?.includes("NotBeforeError") || 
    err.name?.includes("TokenExpiredError") || 
    err.message?.toLowerCase().includes("jwt");

  if (isProd) {
    if (isPrismaError) {
      statusCode = 400;
      code = "DATABASE_ERROR";
      message = "A database operation error occurred. Please verify your data constraints.";
    } else if (isJwtError) {
      statusCode = 401;
      code = "INVALID_TOKEN";
      message = "Invalid or expired authentication token.";
    } else if (!err.isOperational) {
      // General non-operational errors
      statusCode = 500;
      code = "INTERNAL_SERVER_ERROR";
      message = "An unexpected server error occurred.";
    }

    // Clean up any leaked server paths from the message just in case
    if (typeof message === "string") {
      message = message.replace(/\/[\w\-\.\/]+/g, "[path]");
    }
  } else {
    // In development, we can still format them clearly but preserve debugging value
    if (isPrismaError) {
      code = "DATABASE_DEBUG_ERROR";
    } else if (isJwtError) {
      code = "JWT_DEBUG_ERROR";
    }
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
};
