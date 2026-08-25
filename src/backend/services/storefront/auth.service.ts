import { prisma } from "../../config/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { EventService } from "../event.service";
import { ActivityType } from "@prisma/client";
import { normalizePhone } from "../../utils/phone";

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

  /**
   * Safely links historical unassociated guest orders (customerId is null) to a verified Customer account.
   * Execution is transaction-safe, idempotent, requires a valid, phone-verified Customer,
   * and never overwrites non-null customerId values.
   */
  static async linkGuestOrdersToCustomer(
    customerId: string,
    verifiedPhone?: string | null,
    email?: string | null,
    ipAddress?: string | null,
    dbClient: any = prisma
  ): Promise<number> {
    if (!customerId) return 0;

    const normalizedPhone = verifiedPhone ? normalizePhone(verifiedPhone) : null;
    const normalizedEmail = email?.trim().toLowerCase() || null;

    if (!normalizedPhone && !normalizedEmail) return 0;

    // 1. Verify customer exists and check verification status
    const customer = await dbClient.customer.findUnique({
      where: { id: customerId },
      select: { id: true, phone: true, phoneVerified: true, email: true },
    });

    if (!customer) return 0;

    // 2. Phone match requires customer.phoneVerified to be true and matching normalized phone
    const canUsePhone = Boolean(
      normalizedPhone &&
      customer.phoneVerified &&
      customer.phone &&
      normalizePhone(customer.phone) === normalizedPhone
    );

    const canUseEmail = Boolean(
      normalizedEmail &&
      customer.email &&
      customer.email.toLowerCase() === normalizedEmail
    );

    if (!canUsePhone && !canUseEmail) return 0;

    const conditions: any[] = [];
    if (canUsePhone && normalizedPhone) {
      conditions.push({ shippingAddress: { contains: normalizedPhone } });
      const digits = normalizedPhone.replace(/\D/g, "");
      if (digits && digits !== normalizedPhone) {
        conditions.push({ shippingAddress: { contains: digits } });
      }
      if (digits.startsWith("8801")) {
        const localDigits = digits.slice(2);
        conditions.push({ shippingAddress: { contains: localDigits } });
      }
    }

    if (canUseEmail && normalizedEmail) {
      conditions.push({ customerEmail: { equals: normalizedEmail, mode: "insensitive" } });
    }

    if (conditions.length === 0) return 0;

    const executeTransaction = async (tx: any) => {
      // 3. Find candidate guest orders strictly where customerId IS NULL
      const guestOrders = await tx.order.findMany({
        where: {
          customerId: null,
          deletedAt: null,
          OR: conditions,
        },
        select: { id: true },
      });

      if (guestOrders.length === 0) return 0;

      const orderIds = guestOrders.map((o: any) => o.id);

      // 4. Perform atomic update with strict customerId: null constraint
      const updateResult = await tx.order.updateMany({
        where: {
          id: { in: orderIds },
          customerId: null, // Ownership protection: never overwrite an existing non-null customerId
        },
        data: {
          customerId: customer.id,
        },
      });

      if (updateResult.count > 0) {
        try {
          await tx.activityLog.create({
            data: {
              userId: customer.id,
              action: "CLAIM_GUEST_ORDERS",
              entityType: "Order",
              entityId: null,
              details: `Claimed ${updateResult.count} historical guest order(s)`,
              ipAddress: ipAddress || null,
            },
          });
        } catch {
          // Non-blocking if ActivityLog creation fails
        }
      }

      return updateResult.count;
    };

    // 5. Ensure transaction safety
    if (typeof dbClient.$transaction === "function") {
      return await dbClient.$transaction(async (tx: any) => executeTransaction(tx));
    } else {
      return await executeTransaction(dbClient);
    }
  }

  /**
   * Alias for backward compatibility
   */
  static async linkHistoricalGuestOrders(customerId: string, phone?: string | null, email?: string | null, ipAddress?: string | null) {
    return this.linkGuestOrdersToCustomer(customerId, phone, email, ipAddress);
  }
}

