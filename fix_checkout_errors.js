const fs = require('fs');
const file = 'src/backend/services/storefront/checkout.service.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/throw new AppError\((.+?), 400, "PRODUCT_UNAVAILABLE"\);/g, 'throw new AppError($1, 404, "PRODUCT_UNAVAILABLE");');
code = code.replace(/throw new AppError\((.+?), 400, "VARIANT_UNAVAILABLE"\);/g, 'throw new AppError($1, 404, "VARIANT_UNAVAILABLE");');
code = code.replace(/throw new AppError\((.+?), 400, "INSUFFICIENT_STOCK"\);/g, 'throw new AppError($1, 409, "INSUFFICIENT_STOCK");');

fs.writeFileSync(file, code);
