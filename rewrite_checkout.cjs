const fs = require('fs');

let file = fs.readFileSync('src/backend/services/storefront/checkout.service.ts', 'utf8');

file = file.replace(/let subtotal = 0;/g, 'let subtotal = new Prisma.Decimal(0);');
file = file.replace(/const unitPrice = variant \? Number\(variant.price\) : Number\(product.price \|\| 0\);/g, 'const unitPrice = variant ? new Prisma.Decimal(variant.price) : new Prisma.Decimal(product.price || 0);');
file = file.replace(/const itemSubtotal = unitPrice \* quantity;/g, 'const itemSubtotal = unitPrice.mul(quantity);');
file = file.replace(/subtotal \+= itemSubtotal;/g, 'subtotal = subtotal.add(itemSubtotal);');

file = file.replace(/let discount = 0;/g, 'let discount = new Prisma.Decimal(0);');

file = file.replace(/if \(subtotal < Number\(coupon\.minOrderAmount\)\) \{/g, 'if (subtotal.lt(new Prisma.Decimal(coupon.minOrderAmount))) {');

file = file.replace(/discountValue: Number\(coupon\.discountValue\),/g, 'discountValue: new Prisma.Decimal(coupon.discountValue),');

file = file.replace(/const calcDiscount = \(subtotal \* Number\(coupon\.discountValue\)\) \/ 100;/g, 'const calcDiscount = subtotal.mul(new Prisma.Decimal(coupon.discountValue)).div(100);');

file = file.replace(/discount = coupon\.maxDiscountAmount\n                \? Math\.min\(calcDiscount, Number\(coupon\.maxDiscountAmount\)\)\n                : calcDiscount;/g, `discount = coupon.maxDiscountAmount
                ? Prisma.Decimal.min(calcDiscount, new Prisma.Decimal(coupon.maxDiscountAmount))
                : calcDiscount;`);

file = file.replace(/discount = Math\.min\(Number\(coupon\.discountValue\), subtotal\);/g, 'discount = Prisma.Decimal.min(new Prisma.Decimal(coupon.discountValue), subtotal);');

file = file.replace(/const shipping = subtotal >= 150 \|\| isFreeShippingCoupon \? 0 : 15;/g, 'const shipping = subtotal.gte(150) || isFreeShippingCoupon ? new Prisma.Decimal(0) : new Prisma.Decimal(15);');

file = file.replace(/const netSubtotal = Math\.max\(0, subtotal - discount\);/g, 'const netSubtotal = Prisma.Decimal.max(0, subtotal.sub(discount));');

file = file.replace(/const tax = Math\.round\(netSubtotal \* 0\.1 \* 100\) \/ 100;/g, 'const tax = netSubtotal.mul(0.1).toDecimalPlaces(2);');

file = file.replace(/const grandTotal = netSubtotal \+ shipping \+ tax;/g, 'const grandTotal = netSubtotal.add(shipping).add(tax);');

file = file.replace(/let cartSubtotal = 0;/g, 'let cartSubtotal = new Prisma.Decimal(0);');
file = file.replace(/const price = item\.variant \? Number\(item\.variant\.price\) : Number\(item\.product\.price \|\| 0\);/g, 'const price = item.variant ? new Prisma.Decimal(item.variant.price) : new Prisma.Decimal(item.product.price || 0);');
file = file.replace(/cartSubtotal \+= price \* item\.quantity;/g, 'cartSubtotal = cartSubtotal.add(price.mul(item.quantity));');

file = file.replace(/if \(coupon\.minOrderAmount !== null && cartSubtotal < Number\(coupon\.minOrderAmount\)\) \{/g, 'if (coupon.minOrderAmount !== null && cartSubtotal.lt(new Prisma.Decimal(coupon.minOrderAmount))) {');

fs.writeFileSync('src/backend/services/storefront/checkout.service.ts', file);
