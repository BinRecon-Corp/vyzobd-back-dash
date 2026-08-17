const fs = require('fs');
const file = 'src/backend/services/return.service.ts';
let content = fs.readFileSync(file, 'utf8');
const target = `      // RESTOCK INVENTORY
      for (const item of returnReq.items) {
        if (item.orderItem.productVariantId) {
          await tx.inventory.updateMany({
            where: { variantId: item.orderItem.productVariantId },
            data: { quantityAvailable: { increment: item.quantity } }
          });
        } else {
          await tx.inventory.updateMany({
            where: { productId: item.orderItem.productId },
            data: { quantityAvailable: { increment: item.quantity } }
          });
        }
      }`;

const replacement = `      // RESTOCK INVENTORY
      for (const item of returnReq.items) {
        if (item.orderItem.productVariantId) {
          const firstInventory = await tx.inventory.findFirst({
            where: { variantId: item.orderItem.productVariantId }
          });
          if (firstInventory) {
            await tx.inventory.update({
              where: { id: firstInventory.id },
              data: { quantityAvailable: { increment: item.quantity } }
            });
          }
        } else {
          const firstInventory = await tx.inventory.findFirst({
            where: { productId: item.orderItem.productId }
          });
          if (firstInventory) {
            await tx.inventory.update({
              where: { id: firstInventory.id },
              data: { quantityAvailable: { increment: item.quantity } }
            });
          }
        }
      }`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log('patched');
