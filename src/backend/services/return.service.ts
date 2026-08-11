import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { ReturnStatus, NotificationType, NotificationChannel } from "@prisma/client";

export class AdminReturnService {
  static async getReturns(options: { page?: number; limit?: number; search?: string; status?: string } = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.status) {
      where.status = options.status as ReturnStatus;
    }

    if (options.search) {
      where.OR = [
        { id: { contains: options.search } },
        { orderId: { contains: options.search } },
        { reason: { contains: options.search } },
        { customer: { email: { contains: options.search } } }
      ];
    }

    const [returns, total] = await Promise.all([
      prisma.returnRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
          order: true,
          items: {
            include: {
              orderItem: {
                include: { product: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.returnRequest.count({ where })
    ]);

    return {
      returns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getReturnById(id: string) {
    const returnReq = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        customer: true,
        order: true,
        items: {
          include: {
            orderItem: {
              include: { product: true }
            }
          }
        }
      }
    });

    if (!returnReq) {
      throw new AppError("Return request not found", 404, "RETURN_NOT_FOUND");
    }

    return returnReq;
  }

  static async approveReturn(id: string, adminNotes?: string) {
    const returnReq = await prisma.returnRequest.findUnique({
      where: { id },
      include: { items: true, order: true }
    });

    if (!returnReq) throw new AppError("Return not found", 404, "RETURN_NOT_FOUND");
    if (returnReq.status !== "REQUESTED") throw new AppError("Only REQUESTED returns can be approved", 400, "INVALID_STATUS");

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.returnRequest.update({
        where: { id },
        data: { status: ReturnStatus.APPROVED, adminNotes }
      });

      await tx.orderTimeline.create({
        data: { orderId: returnReq.orderId, status: returnReq.order.status, action: "RETURN_APPROVED" }
      });

      // Send customer notification
      await tx.notification.create({
        data: {
          customerId: returnReq.customerId,
          orderId: returnReq.orderId,
          type: NotificationType.RETURN_APPROVED,
          channel: NotificationChannel.IN_APP,
          title: "Return Request Approved",
          message: `Your return request for order #${returnReq.orderId.split("-")[0]} has been approved.`,
          status: "PENDING"
        }
      });

      return updated;
    });
  }

  static async rejectReturn(id: string, adminNotes?: string) {
    const returnReq = await prisma.returnRequest.findUnique({
      where: { id },
      include: { order: true }
    });

    if (!returnReq) throw new AppError("Return not found", 404, "RETURN_NOT_FOUND");
    if (returnReq.status !== "REQUESTED") throw new AppError("Only REQUESTED returns can be rejected", 400, "INVALID_STATUS");

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.returnRequest.update({
        where: { id },
        data: { status: ReturnStatus.REJECTED, adminNotes }
      });

      // Send customer notification
      await tx.notification.create({
        data: {
          customerId: returnReq.customerId,
          orderId: returnReq.orderId,
          type: NotificationType.GENERAL,
          channel: NotificationChannel.IN_APP,
          title: "Return Request Rejected",
          message: `Your return request for order #${returnReq.orderId.split("-")[0]} has been rejected.${adminNotes ? ` Note: ${adminNotes}` : ''}`,
          status: "PENDING"
        }
      });

      return updated;
    });
  }

  static async receiveReturn(id: string, adminNotes?: string) {
    const returnReq = await prisma.returnRequest.findUnique({
      where: { id },
      include: { items: { include: { orderItem: true } }, order: true }
    });

    if (!returnReq) throw new AppError("Return not found", 404, "RETURN_NOT_FOUND");
    if (returnReq.status !== "APPROVED") throw new AppError("Only APPROVED returns can be received", 400, "INVALID_STATUS");

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.returnRequest.update({
        where: { id },
        data: { status: ReturnStatus.RECEIVED, adminNotes }
      });

      // RESTOCK INVENTORY
      for (const item of returnReq.items) {
        if (item.orderItem.productVariantId) {
          await tx.inventory.updateMany({
            where: { variantId: item.orderItem.productVariantId },
            data: { quantityAvailable: { increment: item.quantity } }
          });
        } else {
          await tx.inventory.updateMany({
            where: { productId: item.orderItem.productId },
            data: { quantityAvailable: { increment: item.quantity } }
          });
        }
      }

      await tx.orderTimeline.create({
        data: { orderId: returnReq.orderId, status: returnReq.order.status, action: "RETURN_RECEIVED" }
      });

      // Send customer notification
      await tx.notification.create({
        data: {
          customerId: returnReq.customerId,
          orderId: returnReq.orderId,
          type: NotificationType.GENERAL,
          channel: NotificationChannel.IN_APP,
          title: "Return Item Received",
          message: `We have received your returned item(s) for order #${returnReq.orderId.split("-")[0]}.`,
          status: "PENDING"
        }
      });

      return updated;
    });
  }
}
