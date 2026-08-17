const fs = require('fs');
let returnSvc = fs.readFileSync('src/backend/services/return.service.ts', 'utf8');

returnSvc = returnSvc.replace(/quantity: \{ increment: item\.quantity \}/g, 'quantityAvailable: { increment: item.quantity }');
fs.writeFileSync('src/backend/services/return.service.ts', returnSvc, 'utf8');

let refundSvc = fs.readFileSync('src/backend/services/refund.service.ts', 'utf8');

const targetRefundRegex = /const payment = refund\.payment;\n\s+const refundableAmount = payment\.amount\.sub\(payment\.refundedAmount\);\n\s+if \(refund\.amount\.gt\(refundableAmount\)\) \{\n\s+throw new AppError\("Refund amount exceeds remaining refundable amount due to concurrent modifications", 400, "EXCEEDS_REFUNDABLE_AMOUNT"\);\n\s+\}/m;

refundSvc = refundSvc.replace(targetRefundRegex, '');

const targetRefundTxRegex = /return await prisma\.\$transaction\(async \(tx\) => \{/m;
const refundReplacement = `return await prisma.$transaction(async (tx) => {
      const currentPayment = await tx.payment.findUnique({ where: { id: payment.id } });
      const currentRefundable = currentPayment.amount.sub(currentPayment.refundedAmount);
      if (refund.amount.gt(currentRefundable)) {
        throw new AppError("Refund amount exceeds remaining refundable amount", 400, "EXCEEDS_REFUNDABLE_AMOUNT");
      }`;

refundSvc = refundSvc.replace(targetRefundTxRegex, refundReplacement);
fs.writeFileSync('src/backend/services/refund.service.ts', refundSvc, 'utf8');
