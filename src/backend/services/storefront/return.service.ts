import { prisma } from "../../config/db";
import { AppError } from "../../utils/AppError";
import { ReturnStatus } from "@prisma/client";

export class StorefrontReturnService {
  static async requestReturn(customerId: string, orderId: string, reason: string, items: { orderItemId: string, quantity: number, reason?: string, condition?: string }[]) {
    const order = await prisma.order.findUnique({
      where: { id: orderId, customerId },
      include: { items: true, returnRequests: { include: { items: true } } }
    });

    if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    
    if (order.status !== "Delivered") {
      throw new AppError("Only delivered orders can be returned", 400, "ORDER_NOT_DELIVERED");
    }

    // Validate quantities
    const orderItemMap = new Map(order.items.map(i => [i.id, i.quantity]));
    const returnedMap = new Map<string, number>();
    
    for (const returnReq of order.returnRequests) {
      if (returnReq.status !== "REJECTED" && returnReq.status !== "CLOSED") {
        for (const item of returnReq.items) {
          returnedMap.set(item.orderItemId, (returnedMap.get(item.orderItemId) || 0) + item.quantity);
        }
      }
    }

    for (const item of items) {
      const orderedQty = orderItemMap.get(item.orderItemId);
      if (!orderedQty) throw new AppError(`Item ${item.orderItemId} is not in order`, 400, "INVALID_ITEM");
      
      const previouslyReturned = returnedMap.get(item.orderItemId) || 0;
      if (previouslyReturned + item.quantity > orderedQty) {
        throw new AppError(`Cannot return ${item.quantity} of item ${item.orderItemId}. Only ${orderedQty - previouslyReturned} remaining eligible for return.`, 400, "EXCEEDS_ORDERED_QUANTITY");
      }
    }

    return await prisma.$transaction(async (tx) => {
      const returnRequest = await tx.returnRequest.create({
        data: {
          orderId,
          customerId,
          reason,
          status: ReturnStatus.REQUESTED,
          items: {
            create: items.map(i => ({
              orderItemId: i.orderItemId,
              quantity: i.quantity,
              reason: i.reason,
              condition: i.condition
            }))
          }
        },
        include: { items: true }
      });

      await tx.orderTimeline.create({
        data: { orderId, status: order.status, action: "RETURN_REQUESTED" }
      });

      return returnRequest;
    });
  }

  static async getReturns(customerId: string) {
    return prisma.returnRequest.findMany({
      where: { customerId },
      include: { items: { include: { orderItem: { include: { product: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getReturnById(customerId: string, id: string) {
    const returnReq = await prisma.returnRequest.findUnique({
      where: { id, customerId },
      include: { items: { include: { orderItem: { include: { product: true } } } } }
    });
    if (!returnReq) throw new AppError("Return request not found", 404, "RETURN_NOT_FOUND");
    return returnReq;
  }
}
