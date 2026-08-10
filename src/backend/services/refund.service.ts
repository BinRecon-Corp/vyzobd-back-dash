import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { Prisma, RefundStatus } from "@prisma/client";

export class AdminRefundService {
  /**
   * Process a refund (either from a pending request or initiate directly)
   */
  static async processRefund(refundId: string, approve: boolean, providerReference?: string) {
    const refund = await prisma.refund.findUnique({
      where: { id: refundId },
      include: { payment: true },
    });

    if (!refund) {
      throw new AppError("Refund not found", 404, "REFUND_NOT_FOUND");
    }

    if (refund.status !== RefundStatus.PENDING) {
      throw new AppError(`Refund cannot be processed from status ${refund.status}`, 400, "INVALID_STATUS");
    }

    if (!approve) {
      return await prisma.$transaction(async (tx) => {
        const rejectedRefund = await tx.refund.update({
          where: { id: refund.id },
          data: { status: RefundStatus.REJECTED },
        });

        await tx.refundTransaction.create({
          data: {
            refundId: refund.id,
            status: RefundStatus.REJECTED,
            responsePayload: { approved: false, actedBy: "ADMIN" },
          },
        });

        return rejectedRefund;
      });
    }

    // Process approval
    const payment = refund.payment;
    const refundableAmount = payment.amount.sub(payment.refundedAmount);

    if (refund.amount.gt(refundableAmount)) {
      throw new AppError("Refund amount exceeds remaining refundable amount due to concurrent modifications", 400, "EXCEEDS_REFUNDABLE_AMOUNT");
    }

    return await prisma.$transaction(async (tx) => {
      const completedRefund = await tx.refund.update({
        where: { id: refund.id },
        data: {
          status: RefundStatus.COMPLETED,
          transactionReference: providerReference,
          completedAt: new Date(),
        },
      });

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          refundedAmount: { increment: refund.amount },
        },
      });

      await tx.refundTransaction.create({
        data: {
          refundId: refund.id,
          providerReference,
          status: RefundStatus.COMPLETED,
          responsePayload: { approved: true, actedBy: "ADMIN" },
        },
      });

      const isFullRefund = updatedPayment.refundedAmount.equals(payment.amount);
      const actionText = isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED";

      await tx.orderTimeline.create({
        data: {
          orderId: refund.orderId,
          status: "PROCESSING", // order status could be changed based on logic
          action: actionText,
        },
      });

      return completedRefund;
    });
  }

  static async initiateAdminRefund(orderId: string, paymentId: string, amount: string | number | Prisma.Decimal, reason: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId, orderId },
      include: { order: true },
    });

    if (!payment) {
      throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
    }

    if (payment.status !== "PAID") {
      throw new AppError("Only paid payments can be refunded", 400, "INVALID_PAYMENT_STATUS");
    }

    const requestedAmount = new Prisma.Decimal(amount);
    const refundableAmount = payment.amount.sub(payment.refundedAmount);

    if (requestedAmount.gt(refundableAmount)) {
      throw new AppError("Requested amount exceeds refundable amount", 400, "EXCEEDS_REFUNDABLE_AMOUNT");
    }
    
    if (requestedAmount.lte(0)) {
        throw new AppError("Refund amount must be greater than zero", 400, "INVALID_AMOUNT");
    }

    const refund = await prisma.$transaction(async (tx) => {
      const createdRefund = await tx.refund.create({
        data: {
          paymentId: payment.id,
          orderId: payment.orderId,
          customerId: payment.customerId,
          amount: requestedAmount,
          currency: payment.currency,
          status: RefundStatus.PENDING,
          reason,
        },
      });

      await tx.refundTransaction.create({
        data: {
          refundId: createdRefund.id,
          status: RefundStatus.PENDING,
          requestPayload: { reason, requestedBy: "ADMIN", amount: requestedAmount },
        },
      });
      
      await tx.orderTimeline.create({
        data: {
          orderId: payment.orderId,
          status: payment.order.status,
          action: "REFUND_REQUESTED", // By admin
        },
      });

      return createdRefund;
    });

    // Automatically process it as approved for direct admin initiate if provider integration allows sync refund
    // For simplicity, we just leave it PENDING or auto-approve. Let's auto-approve.
    return await this.processRefund(refund.id, true, "admin-auto");
  }
}
