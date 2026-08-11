const fs = require('fs');
const file = 'src/backend/services/storefront/checkout.service.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
/const updated = await tx\.coupon\.updateMany[\s\S]*?COUPON_LIMIT_REACHED"\);\n        \}/,
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
