import { prisma } from "../../config/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { EventService } from "../event.service";
import { ActivityType } from "@prisma/client";

export class StorefrontAuthService {
  static async revokeCustomerRefreshToken(tokenHash: string) {
    await prisma.customerRefreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  static async revokeAllCustomerRefreshTokens(customerId: string) {
    await prisma.customerRefreshToken.updateMany({
      where: { customerId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  static hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  static async createCustomerRefreshToken(customerId: string, tokenString: string, expiresAt: Date, ipAddress?: string, userAgent?: string) {
    const tokenHash = this.hashToken(tokenString);
    await prisma.customerRefreshToken.create({
      data: {
        customerId,
        tokenHash,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });
  }
}
