const fs = require('fs');

let content = fs.readFileSync('src/backend/services/payment.service.ts', 'utf8');

const targetFunctionRegex = /static async updatePaymentStatus\([\s\S]*?\}\n  \}/m;

const replacement = `static async updatePaymentStatus(id: string, status: PaymentStatus) {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
    }

    return await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id },
        data: {
          status,
          paidAt: status === PaymentStatus.PAID ? new Date() : payment.paidAt
        }
      });

      if (status === PaymentStatus.PAID) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: "Paid",
            status: "Processing"
          }
        });

        await tx.orderTimeline.create({
          data: {
            orderId: payment.orderId,
            status: "Processing",
            action: "Payment confirmed successfully."
          }
        });
      } else if (status === PaymentStatus.FAILED) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: "Failed"
          }
        });
      }

      return updatedPayment;
    });
  }`;

content = content.replace(targetFunctionRegex, replacement);
fs.writeFileSync('src/backend/services/payment.service.ts', content, 'utf8');
