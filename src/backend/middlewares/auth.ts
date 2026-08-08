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

    // Part 6 - JWT Hardening (signature, expiration, issuer, audience verification)
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: "ecommerce-admin-api",
      audience: "ecommerce-admin-app"
    }) as any;

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
  } catch (error: any) {
    // Part 8 & Part 13 - Invalid JWT security logging
    const ip = req.ip || req.socket.remoteAddress || "Unknown";
    console.warn(`[SECURITY] Invalid or malformed JWT Token attempt from IP: ${ip}, error: ${error.message}`);
    
    try {
      await prisma.activityLog.create({
        data: {
          userId: null,
          action: "INVALID_TOKEN",
          entityType: "Security",
          entityId: null,
          ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip || req.socket.remoteAddress || null,
          details: JSON.stringify({
            reason: error.message || "JWT verification failed",
            tokenFragment: req.headers.authorization ? req.headers.authorization.substring(0, 15) + "..." : null,
            timestamp: new Date().toISOString()
          })
        }
      });
    } catch (logErr) {
      console.error("Failed to log invalid token to activity log:", logErr);
    }

    return next(new AppError("Invalid or expired token", 401, "UNAUTHORIZED"));
  }
};

export const requirePermission = (module: string, action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new AppError("User not authenticated", 401, "UNAUTHORIZED"));
      }

      // SuperAdmin bypasses all permission checks
      if (req.user.roleName === "SuperAdmin") {
        return next();
      }

      const role = await prisma.role.findUnique({
        where: { id: req.user.roleId },
        include: { permissions: true },
      });

      if (!role) {
        return next(new AppError("Role not found", 403, "FORBIDDEN"));
      }

      const hasPermission = role.permissions.some(
        (p) =>
          p.module.toLowerCase() === module.toLowerCase() &&
          (p.action.toLowerCase() === action.toLowerCase() || p.action === "all")
      );

      if (!hasPermission) {
        // Part 8 & Part 13 - Permission denied security logging
        console.warn(`[SECURITY] Permission Denied for user ${req.user.email} calling action ${action} on module ${module}`);
        
        try {
          await prisma.activityLog.create({
            data: {
              userId: req.user.id,
              action: "ACCESS_DENIED",
              entityType: "Security",
              entityId: module,
              ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip || req.socket.remoteAddress || null,
              details: JSON.stringify({
                module,
                action,
                reason: "Required privileges missing",
                timestamp: new Date().toISOString()
              })
            }
          });
        } catch (logErr) {
          console.error("Failed to log access denied to activity log:", logErr);
        }

        return next(
          new AppError(`You do not have permission (${action} on ${module}) to perform this action`, 403, "FORBIDDEN")
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireSuperAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.roleName !== "SuperAdmin") {
    // Part 8 & Part 13 - Permission denied logs
    const userId = req.user?.id || null;
    console.warn(`[SECURITY] SuperAdmin access denied for user ${req.user?.email || "Anonymous"}`);
    
    try {
      await prisma.activityLog.create({
        data: {
          userId,
          action: "ACCESS_DENIED",
          entityType: "Security",
          entityId: "SuperAdminModule",
          ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip || req.socket.remoteAddress || null,
          details: JSON.stringify({
            reason: "SuperAdmin authorization required",
            timestamp: new Date().toISOString()
          })
        }
      });
    } catch (logErr) {
      console.error("Failed to log access denied to activity log:", logErr);
    }

    return next(new AppError("Only SuperAdmin can perform this action", 403, "FORBIDDEN"));
  }
  next();
};
