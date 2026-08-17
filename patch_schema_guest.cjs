const fs = require('fs');
const file = 'prisma/schema.prisma';
let code = fs.readFileSync(file, 'utf8');

// Make Order.customerId nullable
code = code.replace(/customerId\s+String\s*\n\s*customer\s+Customer\s+@relation/g, 'customerId               String?\n  customer                 Customer?                @relation');

// Make Payment.customerId nullable
code = code.replace(/customerId\s+String\s*\n\s*provider/g, 'customerId           String?\n  provider');
code = code.replace(/customer\s+Customer\s+@relation\(fields: \[customerId\]/g, 'customer             Customer?            @relation(fields: [customerId]');

fs.writeFileSync(file, code);
