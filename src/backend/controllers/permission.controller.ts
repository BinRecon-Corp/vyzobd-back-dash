import { Response, NextFunction } from "express";
import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { AuthRequest } from "../middlewares/auth";
import { AuditService } from "../services/audit.service";

// GET /api/v1/permissions
export const getAllPermissions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { action: "asc" }],
    });

    res.status(200).json({
      status: "success",
      results: permissions.length,
      data: { permissions },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/roles/:id/permissions
export const updateRolePermissions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { permissionIds, permissions } = req.body;

    const role = await prisma.role.findFirst({
      where: { id, deletedAt: null },
      include: { users: { where: { deletedAt: null }, select: { id: true } } },
    });

    if (!role) {
      return next(new AppError("Role not found", 404, "NOT_FOUND"));
    }

    let targetPermissionIds: string[] = [];

    if (Array.isArray(permissionIds)) {
      targetPermissionIds = permissionIds;
    } else if (Array.isArray(permissions)) {
      // Check if array of objects { module, action } or array of IDs
      if (permissions.length > 0 && typeof permissions[0] === "string") {
        targetPermissionIds = permissions;
      } else if (permissions.length > 0 && typeof permissions[0] === "object") {
        // Resolve permission IDs from module and action pairs
        const allDbPerms = await prisma.permission.findMany();
        targetPermissionIds = permissions
          .map((pObj: { module: string; action: string }) => {
            const found = allDbPerms.find(
              (dp) =>
                dp.module.toLowerCase() === pObj.module.toLowerCase() &&
                dp.action.toLowerCase() === pObj.action.toLowerCase()
            );
            return found ? found.id : null;
          })
          .filter(Boolean) as string[];
      }
    } else {
      return next(new AppError("permissionIds or permissions array is required", 400, "MISSING_FIELDS"));
    }

    // Verify permission IDs exist
    const validPerms = await prisma.permission.findMany({
      where: { id: { in: targetPermissionIds } },
      select: { id: true },
    });

    const validIds = validPerms.map((p) => p.id);

    // Update role's permission connections
    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        permissions: {
          set: validIds.map((permId) => ({ id: permId })),
        },
      },
      include: {
        permissions: {
          select: {
            id: true,
            name: true,
            module: true,
            action: true,
          },
        },
      },
    });

    // REFRESH TOKEN SAFETY: Revoke refresh tokens for all active users assigned to this role
    const assignedUserIds = role.users.map((u) => u.id);
    if (assignedUserIds.length > 0) {
      await prisma.refreshToken.updateMany({
        where: {
          userId: { in: assignedUserIds },
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    await AuditService.logPermissionChanged(
      req.user?.id || null,
      id,
      role.name,
      { permissionIds: validIds, revokedUsersCount: assignedUserIds.length },
      req
    );

    res.status(200).json({
      status: "success",
      message: `Permissions updated for role ${role.name}`,
      data: { role: updatedRole },
    });
  } catch (error) {
    next(error);
  }
};
