const fs = require('fs');
const file = 'src/backend/services/storefront/checkout.service.ts';
let code = fs.readFileSync(file, 'utf8');

const replacement = `      // Log Order Timeline Event
      await tx.orderTimeline.create({
        data: {
          orderId: newOrder.id,
          status: "Pending",
          action: "Order successfully placed and checked out.",
        },
      });

      // Create COD Payment record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          customerId,
          provider: "COD",
          amount: session.grandTotal,
          currency: "USD",
          status: "PENDING",
        }
      });`;

const targetStr = `      // Log Order Timeline Event
      await tx.orderTimeline.create({
        data: {
          orderId: newOrder.id,
          status: "Pending",
          action: "Order successfully placed and checked out.",
        },
      });`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacement);
  fs.writeFileSync(file, code);
  console.log('Fixed checkout service payment record');
} else {
  console.log('Could not find target string');
}
