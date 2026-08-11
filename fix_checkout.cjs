const fs = require('fs');
const file = 'src/backend/services/storefront/checkout.service.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
/await tx\.inventory\.update\({\s*where: { id: targetInventory\.id },\s*data: {\s*quantityAvailable: {\s*decrement: item\.quantity,\s*},\s*},\s*}\);/g,
`const updated = await tx.inventory.updateMany({
                where: { 
                  id: targetInventory.id,
                  quantityAvailable: { gte: item.quantity + targetInventory.quantityReserved }
                },
                data: {
                  quantityAvailable: { decrement: item.quantity },
                },
              });
              if (updated.count === 0) {
                throw new AppError(\`Insufficient stock for "\${item.productName}" during checkout. Please try again.\`, 400, "INSUFFICIENT_STOCK");
              }`
);

code = code.replace(
/await tx\.inventory\.update\({\s*where: { id: product\.inventory\.id },\s*data: {\s*quantityAvailable: {\s*decrement: item\.quantity,\s*},\s*},\s*}\);/g,
`const updated = await tx.inventory.updateMany({
              where: { 
                id: product.inventory.id,
                quantityAvailable: { gte: item.quantity + product.inventory.quantityReserved }
              },
              data: {
                quantityAvailable: { decrement: item.quantity },
              },
            });
            if (updated.count === 0) {
              throw new AppError(\`Insufficient stock for "\${product.name}" during checkout. Please try again.\`, 400, "INSUFFICIENT_STOCK");
            }`
);

code = code.replace(
/await tx\.coupon\.update\({\s*where: { id: coupon\.id },\s*data: {\s*usedCount: {\s*increment: 1,\s*},\s*},\s*}\);/g,
`if (coupon.usageLimit !== null) {
          const updated = await tx.coupon.updateMany({
            where: { id: coupon.id, usedCount: { lt: coupon.usageLimit } },
            data: { usedCount: { increment: 1 } },
          });
          if (updated.count === 0) {
            throw new AppError("Coupon usage limit exceeded during checkout", 400, "COUPON_LIMIT_REACHED");
          }
        } else {
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
        }`
);

fs.writeFileSync(file, code);
