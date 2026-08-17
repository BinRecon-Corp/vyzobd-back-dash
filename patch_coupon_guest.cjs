const fs = require('fs');
const file = 'src/backend/services/storefront/checkout.service.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/const customerOrdersWithCoupon = identifier\.customerId \? await prisma\.order\.count\(\{\n\s+where: \{\n\s+customerId: identifier\.customerId,\n\s+couponId: coupon\.id,\n\s+\},\n\s+\}\);/g, 
`const customerOrdersWithCoupon = identifier.customerId ? await prisma.order.count({
              where: {
                customerId: identifier.customerId,
                couponId: coupon.id,
              },
            }) : 0;`);

fs.writeFileSync(file, code);
