import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { PaymentStatus } from "@prisma/client";

export class AdminPaymentService {
  static async getPayments(options: { page?: number; limit?: number; search?: string; status?: string } = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.status) {
      where.status = options.status as PaymentStatus;
    }

    if (options.search) {
      where.OR = [
        { id: { contains: options.search } },
        { orderId: { contains: options.search } },
        { transactionReference: { contains: options.search } },
        { customer: { email: { contains: options.search } } }
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: true,
          order: true,
          transactions: true,
          refunds: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payment.count({ where })
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getPaymentById(id: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        customer: true,
        order: true,
        transactions: true,
        refunds: true
      }
    });

    if (!payment) {
      throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
    }

    return payment;
  }

  static async updatePaymentStatus(id: string, status: PaymentStatus) {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
    }

    return prisma.payment.update({
      where: { id },
      data: {
        status,
        paidAt: status === PaymentStatus.PAID ? new Date() : payment.paidAt
      }
    });
  }
}
