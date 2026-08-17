const fs = require('fs');
const file = 'src/backend/services/refund.service.ts';
let code = fs.readFileSync(file, 'utf8');

const replacement = `  static async processRefund(refundId: string, approve: boolean, providerReference?: string) {
    if (!approve) {
      return await prisma.$transaction(async (tx) => {
        const refund = await tx.refund.findUnique({ where: { id: refundId } });
        if (!refund) throw new AppError("Refund not found", 404, "REFUND_NOT_FOUND");
        if (refund.status !== RefundStatus.PENDING) {
          throw new AppError(\`Refund cannot be processed from status \${refund.status}\`, 400, "INVALID_STATUS");
        }

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
    return await prisma.$transaction(async (tx) => {
      const refund = await tx.refund.findUnique({ 
        where: { id: refundId },
        include: { payment: true, order: true },
      });
      if (!refund) throw new AppError("Refund not found", 404, "REFUND_NOT_FOUND");
      if (refund.status !== RefundStatus.PENDING) {
        throw new AppError(\`Refund cannot be processed from status \${refund.status}\`, 400, "INVALID_STATUS");
      }

      const currentPayment = await tx.payment.update({
        where: { id: refund.paymentId },
        data: { updatedAt: new Date() } // Lock the row
      });

      if (!currentPayment) {
        throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
      }

      const currentRefundable = currentPayment.amount.sub(currentPayment.refundedAmount);
      
      if (refund.amount.gt(currentRefundable)) {
        throw new AppError("Refund amount exceeds remaining refundable amount", 400, "EXCEEDS_REFUNDABLE_AMOUNT");
      }

      const completedRefund = await tx.refund.update({
        where: { id: refund.id },
        data: {
          status: RefundStatus.COMPLETED,
          transactionReference: providerReference,
          completedAt: new Date(),
        },
        include: { order: true, payment: true },
      });

      const updatedPayment = await tx.payment.update({
        where: { id: currentPayment.id },
        data: {
          refundedAmount: { increment: refund.amount },
        },
      });`;

const startStr = "  static async processRefund(refundId: string, approve: boolean, providerReference?: string) {";
const endStr = "      const updatedPayment = await tx.payment.update({\n        where: { id: currentPayment.id },\n        data: {\n          refundedAmount: { increment: refund.amount },\n        },\n      });";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr) + endStr.length;

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
  fs.writeFileSync(file, code);
  console.log('Fixed refund service');
} else {
  console.log('Could not find start or end index');
}
