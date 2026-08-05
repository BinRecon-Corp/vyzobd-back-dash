import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError | ZodError | Error,
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

  const statusCode = (err as AppError).statusCode || 500;
  const code = (err as AppError).code || "INTERNAL_SERVER_ERROR";
  const message = (err as AppError).isOperational ? err.message : "Something went wrong";

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
};
