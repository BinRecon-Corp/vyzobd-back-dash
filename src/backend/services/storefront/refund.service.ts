import { prisma } from "../../config/db";
import { AppError } from "../../utils/AppError";
import { Prisma, RefundStatus } from "@prisma/client";

export class StorefrontRefundService {
  /**
   * Customer requests a refund
   */
  static async requestRefund(customerId: string, orderId: string, reason: string, amount?: Prisma.Decimal | number | string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId, customerId },
      include: {
        payments: {
          where: { status: "PAID" },
        },
      },
    });

    if (!order) {
      throw new AppError("Order not found or unauthorized", 404, "ORDER_NOT_FOUND");
    }

    if (order.payments.length === 0) {
      throw new AppError("No successful payment found for this order", 400, "NO_PAYMENT");
    }

    // Assuming we refund the primary successful payment
    const payment = order.payments[0];
    const requestedAmount = amount ? new Prisma.Decimal(amount) : payment.amount;

    // Check refundable amount
    const refundableAmount = payment.amount.sub(payment.refundedAmount);
    if (requestedAmount.gt(refundableAmount)) {
      throw new AppError(`Cannot request refund greater than refundable amount (${refundableAmount.toString()})`, 400, "EXCEEDS_REFUNDABLE_AMOUNT");
    }

    if (requestedAmount.lte(0)) {
      throw new AppError("Refund amount must be greater than zero", 400, "INVALID_AMOUNT");
    }

    // Idempotency: prevent multiple pending refund requests for the same order/payment
    const existingPending = await prisma.refund.findFirst({
      where: {
        paymentId: payment.id,
        status: "PENDING",
      },
    });

    if (existingPending) {
      throw new AppError("A refund request is already pending for this payment", 400, "REFUND_ALREADY_PENDING");
    }

    return await prisma.$transaction(async (tx) => {
      const refund = await tx.refund.create({
        data: {
          paymentId: payment.id,
          orderId: order.id,
          customerId,
          amount: requestedAmount,
          currency: payment.currency,
          status: RefundStatus.PENDING,
          reason,
        },
      });

      await tx.refundTransaction.create({
        data: {
          refundId: refund.id,
          status: RefundStatus.PENDING,
          requestPayload: { reason, requestedBy: "CUSTOMER", amount: requestedAmount },
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: order.id,
          status: order.status,
          action: "REFUND_REQUESTED",
        },
      });

      return refund;
    });
  }

  static async getCustomerRefunds(customerId: string) {
    return prisma.refund.findMany({
      where: { customerId },
      include: { payment: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
