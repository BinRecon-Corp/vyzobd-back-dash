import { prisma } from "../../config/db";

export class StorefrontAccountService {
  static async getDashboard(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        addresses: {
          where: { isDefault: true },
          take: 1,
        },
        _count: {
          select: {
            orders: true,
          }
        },
        wishlist: {
          include: {
            _count: {
              select: { items: true }
            }
          }
        }
      }
    });

    const recentSession = await prisma.customerRefreshToken.findFirst({
      where: { customerId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      }
    });

    return {
      profile: {
        id: customer?.id,
        firstName: customer?.firstName,
        lastName: customer?.lastName,
        email: customer?.email,
        phone: customer?.phone,
        isVerified: customer?.isVerified,
        lastLoginAt: customer?.lastLoginAt,
        createdAt: customer?.createdAt,
      },
      defaultAddress: customer?.addresses[0] || null,
      stats: {
        orders: customer?._count.orders || 0,
        wishlist: customer?.wishlist?._count.items || 0,
      },
      recentSession,
    };
  }

  static async setDefaultAddress(customerId: string, addressId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.customerAddress.updateMany({
        where: { customerId, isDefault: true },
        data: { isDefault: false },
      });
      await tx.customerAddress.update({
        where: { id: addressId, customerId },
        data: { isDefault: true },
      });
    });
  }

  static async getSessions(customerId: string) {
    return prisma.customerRefreshToken.findMany({
      where: { customerId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      }
    });
  }

  static async revokeSession(customerId: string, sessionId: string) {
    await prisma.customerRefreshToken.updateMany({
      where: { id: sessionId, customerId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  static async revokeAllSessionsExcept(customerId: string, currentSessionTokenHash: string | null) {
    const whereClause: any = {
      customerId,
      revokedAt: null,
    };
    if (currentSessionTokenHash) {
      whereClause.tokenHash = { not: currentSessionTokenHash };
    }

    await prisma.customerRefreshToken.updateMany({
      where: whereClause,
      data: { revokedAt: new Date() },
    });
  }
}
