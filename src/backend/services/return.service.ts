import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { ReturnStatus } from "@prisma/client";

export class AdminReturnService {
  static async getReturns() {
    return prisma.returnRequest.findMany({
      include: { customer: true, order: true },
      orderBy: { createdAt: 'desc' }
    });
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
            data: { quantity: { increment: item.quantity } }
          });
        } else {
          await tx.inventory.updateMany({
            where: { productId: item.orderItem.productId },
            data: { quantity: { increment: item.quantity } }
          });
        }
      }

      await tx.orderTimeline.create({
        data: { orderId: returnReq.orderId, status: returnReq.order.status, action: "RETURN_RECEIVED" }
      });

      return updated;
    });
  }
}
