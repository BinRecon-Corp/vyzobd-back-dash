import { prisma } from "../config/db";
import { NotificationType, NotificationChannel } from "@prisma/client";
import { EventService } from "./event.service";

export class AdminNotificationService {
  static async getNotifications(options: { page?: number, limit?: number }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: true }
      }),
      prisma.notification.count()
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

  static async sendNotification(customerId: string, type: NotificationType, title: string, message: string, channel: NotificationChannel, metadata?: any) {
    await EventService.sendNotification(customerId, type, title, message, channel, metadata);
    return { success: true };
  }
}
