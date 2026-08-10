import { prisma } from "../../config/db";
import { AppError } from "../../utils/AppError";

export class StorefrontNotificationService {
  static async getNotifications(customerId: string, options: { page?: number, limit?: number }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { customerId, channel: "IN_APP" },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where: { customerId, channel: "IN_APP" } })
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getUnreadCount(customerId: string) {
    const count = await prisma.notification.count({
      where: { customerId, channel: "IN_APP", status: "PENDING" }
    });
    return count;
  }

  static async markAsRead(customerId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId, customerId }
    });

    if (!notification) throw new AppError("Notification not found", 404, "NOT_FOUND");

    return prisma.notification.update({
      where: { id: notificationId },
      data: { status: "READ" }
    });
  }

  static async markAllAsRead(customerId: string) {
    await prisma.notification.updateMany({
      where: { customerId, channel: "IN_APP", status: "PENDING" },
      data: { status: "READ" }
    });
  }
}
