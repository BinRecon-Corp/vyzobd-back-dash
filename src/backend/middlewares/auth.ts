import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { prisma } from "../config/db";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roleId: string;
    roleName: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError("You are not logged in! Please log in to get access.", 401, "UNAUTHORIZED")
      );
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as any;

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });

    if (!currentUser || !currentUser.isActive) {
      return next(
        new AppError("The user belonging to this token no longer exists or is inactive.", 401, "UNAUTHORIZED")
      );
    }

    req.user = {
      id: currentUser.id,
      email: currentUser.email,
      roleId: currentUser.roleId,
      roleName: currentUser.role.name,
    };
    next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401, "UNAUTHORIZED"));
  }
};

export const requirePermission = (module: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError("User not authenticated", 401, "UNAUTHORIZED"));
      }

      const role = await prisma.role.findUnique({
        where: { id: req.user.roleId },
        include: { permissions: true },
      });

      if (!role) {
        return next(new AppError("Role not found", 403, "FORBIDDEN"));
      }

      const hasPermission = role.permissions.some(
        (p) => p.module === module && (p.action === action || p.action === "all")
      );

      if (!hasPermission) {
        return next(
          new AppError("You do not have permission to perform this action", 403, "FORBIDDEN")
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
