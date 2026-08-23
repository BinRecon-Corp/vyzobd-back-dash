import { prisma } from "../../config/db";
import { emailService } from "../../services/email.service";
import { AppError } from "../../utils/AppError";
import { ReturnStatus } from "@prisma/client";
import { mapReturnRequestToStorefrontDTO } from "../../dtos/storefront/mappers";

export class StorefrontReturnService {
  static async requestReturn(
    customerId: string,
    orderId: string,
    reason: string,
    items: { orderItemId: string; quantity: number; reason?: string; condition?: string }[]
  ) {
    if (!reason || reason.trim().length === 0) {
      throw new AppError("Reason is required for return request", 400, "INVALID_REASON");
    }

    if (!items || items.length === 0) {
      throw new AppError("At least one item must be specified for return", 400, "INVALID_ITEMS");
    }

    const returnRequestTransaction = await prisma.$transaction(async (tx) => {
      // 1. Lock the Order row to serialize concurrent return requests for this order
      await tx.order.update({
        where: { id: orderId },
        data: { updatedAt: new Date() },
      });

      // 2. Re-read fresh Order state with items and existing return requests under lock
      const order = await tx.order.findUnique({
        where: { id: orderId, customerId },
        include: { items: true, returnRequests: { include: { items: true } } },
      });

      if (!order) {
        throw new AppError("Order not found or unauthorized", 404, "ORDER_NOT_FOUND");
      }

      if (order.status.toLowerCase() !== "delivered") {
        throw new AppError(
          `Only delivered orders can be returned (current order status: ${order.status})`,
          400,
          "ORDER_NOT_DELIVERED"
        );
      }

      // 3. Validate quantities against authoritative order and non-rejected return requests
      const orderItemObjMap = new Map(order.items.map((i) => [i.id, i]));
      const orderItemMap = new Map(order.items.map((i) => [i.id, i.quantity]));
      const returnedMap = new Map<string, number>();

      for (const returnReq of order.returnRequests) {
        if (returnReq.status !== ReturnStatus.REJECTED) {
          for (const item of returnReq.items) {
            returnedMap.set(item.orderItemId, (returnedMap.get(item.orderItemId) || 0) + item.quantity);
          }
        }
      }

      for (const item of items) {
        if (!item.quantity || item.quantity <= 0) {
          throw new AppError("Return item quantity must be greater than zero", 400, "INVALID_QUANTITY");
        }

        const orderedQty = orderItemMap.get(item.orderItemId);
        if (orderedQty === undefined) {
          throw new AppError(`Item ${item.orderItemId} is not part of this order`, 400, "INVALID_ITEM");
        }

        const previouslyReturned = returnedMap.get(item.orderItemId) || 0;
        const remainingEligible = orderedQty - previouslyReturned;

        if (item.quantity > remainingEligible) {
          throw new AppError(
            `Cannot return ${item.quantity} of item ${item.orderItemId}. Only ${remainingEligible} remaining eligible for return.`,
            400,
            "EXCEEDS_ORDERED_QUANTITY"
          );
        }

        // Track in map for multi-item requests with duplicate item references
        returnedMap.set(item.orderItemId, previouslyReturned + item.quantity);
      }

      // 4. Create authoritative ReturnRequest and ReturnItems
      const returnRequest = await tx.returnRequest.create({
        data: {
          orderId,
          customerId,
          reason,
          status: ReturnStatus.REQUESTED,
          items: {
            create: items.map((i) => ({
              orderItemId: i.orderItemId,
              warehouseId: orderItemObjMap.get(i.orderItemId)?.warehouseId || null,
              quantity: i.quantity,
              reason: i.reason,
              condition: i.condition,
            })),
          },
        },
        include: { items: true },
      });

      await tx.orderTimeline.create({
        data: { orderId, status: order.status, action: "RETURN_REQUESTED" },
      });

      return returnRequest;
    });

    try {
      const fullOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true },
      });
      const orderEmail = fullOrder?.customer?.email || fullOrder?.customerEmail;
      if (fullOrder && orderEmail) {
        const emailRecipient = {
          email: orderEmail,
          firstName: fullOrder.customer?.firstName || "Customer",
        };
        emailService.sendReturnRequestedEmail(emailRecipient, returnRequestTransaction, fullOrder).catch(() => {});
      }
    } catch (e) {}

    return mapReturnRequestToStorefrontDTO(returnRequestTransaction);
  }

  static async getReturns(customerId: string) {
    const returns = await prisma.returnRequest.findMany({
      where: { customerId },
      include: { items: { include: { orderItem: { include: { product: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    return returns.map(mapReturnRequestToStorefrontDTO);
  }

  static async getReturnById(customerId: string, id: string) {
    const returnReq = await prisma.returnRequest.findUnique({
      where: { id, customerId },
      include: { items: { include: { orderItem: { include: { product: true } } } } },
    });
    if (!returnReq) throw new AppError("Return request not found", 404, "RETURN_NOT_FOUND");
    return mapReturnRequestToStorefrontDTO(returnReq);
  }
}

