const fs = require('fs');
const file = 'src/backend/controllers/order.controller.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `    if (internalNotes !== undefined) {
      updateData.internalNotes = internalNotes;
    }

    const updatedOrder = await prisma.order.update({`;

const replacement = `    if (internalNotes !== undefined) {
      updateData.internalNotes = internalNotes;
    }

    if (status === "Cancelled" && existingOrder.status !== "Cancelled") {
      // Restore inventory
      const orderItems = await prisma.orderItem.findMany({ where: { orderId: id } });
      for (const item of orderItems) {
        if (item.productVariantId) {
          const inv = await prisma.inventory.findFirst({ where: { variantId: item.productVariantId } });
          if (inv) await prisma.inventory.update({ where: { id: inv.id }, data: { quantityAvailable: { increment: item.quantity } } });
        } else {
          const inv = await prisma.inventory.findFirst({ where: { productId: item.productId } });
          if (inv) await prisma.inventory.update({ where: { id: inv.id }, data: { quantityAvailable: { increment: item.quantity } } });
        }
      }
    }

    const updatedOrder = await prisma.order.update({`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log('patched order');
