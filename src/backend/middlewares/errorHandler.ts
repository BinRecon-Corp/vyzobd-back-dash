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

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: (err as any).errors.map((e: any) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
    });
  }

  if (err.code === "P2002") {
    const target = err.meta?.target as string[] | string;
    const field = Array.isArray(target) ? target.join(", ") : (target || "field");
    return res.status(400).json({
      success: false,
      error: {
        code: "UNIQUE_CONSTRAINT_VIOLATION",
        message: `A record with this ${field} already exists.`,
      },
    });
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_SERVER_ERROR";
  const message = err.isOperational ? err.message : (err.message || "Internal Server Error");

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
};
