import { prisma } from "../../config/db";
import { emailService } from "../../services/email.service";
import { AppError } from "../../utils/AppError";
import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { MeasurementProtocolService } from "../measurement-protocol.service";

interface PaymentProviderInterface {
  initiatePayment(paymentId: string, amount: any, currency: string, orderId: string): Promise<any>;
  verifyPayment(providerTransactionId: string, paymentId: string): Promise<boolean>;
}

class BaseProviderAdapter implements PaymentProviderInterface {
  constructor(protected providerName: string) {}

  async initiatePayment(paymentId: string, amount: any, currency: string, orderId: string): Promise<any> {
    // Abstract implementation
    return {
      success: true,
      provider: this.providerName,
      paymentUrl: `https://mock-${this.providerName.toLowerCase()}.com/pay/${paymentId}`,
      reference: `REF-${paymentId.substring(0, 8)}`,
    };
  }

  async verifyPayment(providerTransactionId: string, paymentId: string): Promise<boolean> {
    // Abstract implementation
    return true; // Assume success in mock
  }
}

class CODProvider extends BaseProviderAdapter {
  constructor() { super("COD"); }
}

class SSLCommerzProvider extends BaseProviderAdapter {
  constructor() { super("SSLCOMMERZ"); }
}

class BkashProvider extends BaseProviderAdapter {
  constructor() { super("BKASH"); }
}

class NagadProvider extends BaseProviderAdapter {
  constructor() { super("NAGAD"); }
}

class StripeProvider extends BaseProviderAdapter {
  constructor() { super("STRIPE"); }
}

export class StorefrontPaymentService {
  private static getProviderAdapter(provider: PaymentProvider): PaymentProviderInterface {
    switch (provider) {
      case "COD": return new CODProvider();
      case "SSLCOMMERZ": return new SSLCommerzProvider();
      case "BKASH": return new BkashProvider();
      case "NAGAD": return new NagadProvider();
      case "STRIPE": return new StripeProvider();
      default: throw new AppError("Invalid payment provider", 400, "INVALID_PROVIDER");
    }
  }

  static async initiatePayment(customerId: string, orderId: string, provider: PaymentProvider) {
    const order = await prisma.order.findUnique({
      where: { id: orderId, customerId },
    });

    if (!order) {
      throw new AppError("Order not found or unauthorized", 404, "ORDER_NOT_FOUND");
    }

    if (order.status === "Cancelled") {
      throw new AppError("Cannot initiate payment for a cancelled order", 400, "ORDER_CANCELLED");
    }

    if (order.paymentStatus === "Paid") {
      throw new AppError("Order is already paid", 400, "ORDER_ALREADY_PAID");
    }
    
    // Prevent duplicate payment creation (Idempotency conceptually)
    const existingPayment = await prisma.payment.findFirst({
        where: { orderId, status: { in: ["PENDING", "PROCESSING"] } }
    });
    
    if (existingPayment && existingPayment.provider === provider) {
        // We could return existing, but for safety let's say it exists
        return { payment: existingPayment, redirectUrl: `https://mock-${provider.toLowerCase()}.com/pay/${existingPayment.id}` };
    }

    const amount = order.totalAmount;
    const currency = "BDT";

    return await prisma.$transaction(async (tx) => {
      // 1. Create Payment Record
      const payment = await tx.payment.create({
        data: {
          orderId,
          customerId,
          provider,
          amount,
          currency,
          status: PaymentStatus.PENDING,
        },
      });

      // 2. Provider Abstraction
      const providerAdapter = this.getProviderAdapter(provider);
      const initResponse = await providerAdapter.initiatePayment(payment.id, amount, currency, orderId);

      // 3. Create Transaction Record
      await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          providerReference: initResponse.reference,
          requestPayload: initResponse,
          status: PaymentStatus.PENDING,
        },
      });
      
      // Update order status if COD
      if (provider === "COD") {
          await tx.order.update({
              where: { id: orderId },
              data: { status: "PROCESSING" }
          });
          await tx.orderTimeline.create({
              data: {
                  orderId,
                  status: "PROCESSING",
                  action: "Order placed with Cash on Delivery"
              }
          });
      }

      return {
        payment,
        initResponse,
      };
    });
  }

  static async getPaymentStatus(customerId: string, paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId, customerId },
      include: {
        transactions: true,
      },
    });

    if (!payment) {
      throw new AppError("Payment not found or unauthorized", 404, "PAYMENT_NOT_FOUND");
    }

    return payment;
  }

  static async verifyPayment(customerId: string, paymentId: string, providerTransactionId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId, customerId },
    });

    if (!payment) {
      throw new AppError("Payment not found or unauthorized", 404, "PAYMENT_NOT_FOUND");
    }

    if (payment.status === PaymentStatus.PAID) {
      return payment; // Already paid
    }

    const providerAdapter = this.getProviderAdapter(payment.provider);
    const isSuccess = await providerAdapter.verifyPayment(providerTransactionId, payment.id);

    const newStatus = isSuccess ? PaymentStatus.PAID : PaymentStatus.FAILED;
    const result = await prisma.$transaction(async (tx) => {

      // 1. Update Payment
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          transactionReference: providerTransactionId,
          paidAt: isSuccess ? new Date() : null,
        },
      });

      // 2. Add transaction log
      await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          providerTransactionId,
          status: newStatus,
          responsePayload: { verified: true, isSuccess },
        },
      });

      // 3. Update Order Status
      if (isSuccess) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: "Paid",
            status: "PROCESSING", // Assuming it goes to processing once paid
          },
        });
        
        await tx.orderTimeline.create({
          data: {
            orderId: payment.orderId,
            status: "PROCESSING",
            action: `Payment successful via ${payment.provider}`,
          },
        });
      }

      return updatedPayment;
    });

    if (payment.status !== newStatus) {
      try {
        const fullOrder = await prisma.order.findUnique({
          where: { id: payment.orderId },
          include: { customer: true, items: true }
        });
        const orderEmail = fullOrder?.customer?.email || fullOrder?.customerEmail;
        if (fullOrder && orderEmail) {
          const emailRecipient = { email: orderEmail, firstName: fullOrder.customer?.firstName || "Customer" };
          if (isSuccess) {
            emailService.sendPaymentSuccessEmail(emailRecipient, result, fullOrder).catch(() => {});
            emailService.sendOrderProcessingEmail(emailRecipient, fullOrder).catch(() => {});
          } else {
            emailService.sendPaymentFailedEmail(emailRecipient, result, fullOrder).catch(() => {});
          }
        }
      } catch (err) {}
    }
    
    if (isSuccess) {
      MeasurementProtocolService.processOrderPaymentSuccess(payment.orderId).catch((err) => {
        console.error("[Analytics] Error tracking purchase on verifyPayment:", err);
      });
    }

    return result;
  }

  static async handleWebhook(provider: string, payload: any, signature: string | undefined) {
    // 1. Log the webhook immediately
    const log = await prisma.paymentWebhookLog.create({
      data: {
        provider,
        payload,
        signature,
      },
    });

    try {
      // Basic idempotency check based on payload contents (provider specific)
      // For this example, let's assume we extract orderId and status from generic payload
      const paymentId = payload.paymentId;
      const providerStatus = payload.status;
      const providerTransactionId = payload.transactionId;
      
      if (!paymentId) {
          throw new Error("No paymentId in webhook payload");
      }
      
      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      if (!payment) {
          throw new Error("Payment not found for webhook");
      }
      
      if (payment.status === PaymentStatus.PAID) {
          // Idempotent: already processed
          await prisma.paymentWebhookLog.update({
              where: { id: log.id },
              data: { processed: true, processedAt: new Date() }
          });
          return { success: true, message: "Already processed" };
      }

      // Simulate signature verification
      if (provider !== "COD" && !signature) {
          throw new Error("Missing signature");
      }
      
      const isSuccess = providerStatus === "SUCCESS";
      const newStatus = isSuccess ? PaymentStatus.PAID : PaymentStatus.FAILED;
      
      await prisma.$transaction(async (tx) => {
          // Update Payment
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: newStatus,
              transactionReference: providerTransactionId || "webhook-auto",
              paidAt: isSuccess ? new Date() : null,
            },
          });
    
          // Add transaction log
          await tx.paymentTransaction.create({
            data: {
              paymentId: payment.id,
              providerTransactionId: providerTransactionId || null,
              status: newStatus,
              responsePayload: payload,
            },
          });
    
          // Update Order Status
          if (isSuccess) {
            await tx.order.update({
              where: { id: payment.orderId },
              data: {
                paymentStatus: "Paid",
                status: "PROCESSING", 
              },
            });
            
            await tx.orderTimeline.create({
              data: {
                orderId: payment.orderId,
                status: "PROCESSING",
                action: `Payment successful via ${provider} webhook`,
              },
            });
          }
      });

      if (isSuccess) {
        MeasurementProtocolService.processOrderPaymentSuccess(payment.orderId).catch((err) => {
          console.error("[Analytics] Error tracking purchase on handleWebhook:", err);
        });
      }

      
      await prisma.paymentWebhookLog.update({
          where: { id: log.id },
          data: { processed: true, processedAt: new Date() }
      });
      
      if (payment.status !== newStatus) {
        try {
          const fullOrder = await prisma.order.findUnique({
            where: { id: payment.orderId },
            include: { customer: true, items: true }
          });
          
          const orderEmail = fullOrder?.customer?.email || fullOrder?.customerEmail;
          if (fullOrder && orderEmail) {
            const emailRecipient = { email: orderEmail, firstName: fullOrder.customer?.firstName || "Customer" };
            // Need to get the updated payment object to pass to email service
            const updatedPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
            
            if (isSuccess) {
              emailService.sendPaymentSuccessEmail(emailRecipient, updatedPayment, fullOrder).catch(() => {});
              emailService.sendOrderProcessingEmail(emailRecipient, fullOrder).catch(() => {});
            } else {
              emailService.sendPaymentFailedEmail(emailRecipient, updatedPayment, fullOrder).catch(() => {});
            }
          }
        } catch (err) {}
      }

      return { success: true };
    } catch (error: any) {
      console.error("Webhook processing error", error);
      // We don't throw, we return a failure response to provider if needed, or maybe we do throw so it retries
      throw error;
    }
  }
}
