const fs = require('fs');
const file = 'src/backend/services/storefront/checkout.service.ts';
let code = fs.readFileSync(file, 'utf8');

// Add import for CartIdentifier
code = code.replace(/import \{ AppError \} from "\.\.\/\.\.\/utils\/AppError";/, 'import { AppError } from "../../utils/AppError";\nimport { CartIdentifier, StorefrontCartService } from "./cart.service";');

code = code.replace(/static async getCheckoutSession\(customerId: string\) \{/g, 'static async getCheckoutSession(identifier: CartIdentifier) {');
code = code.replace(/const cart = await prisma\.cart\.findUnique\(\{[\s\S]*?where: \{ customerId \},/g, `const cart = await prisma.cart.findFirst({
      where: identifier.customerId ? { customerId: identifier.customerId } : { sessionId: identifier.sessionId },`);

code = code.replace(/static async applyCoupon\(\n\s+customerId: string,/g, 'static async applyCoupon(\n    identifier: CartIdentifier,');
code = code.replace(/where: \{ customerId \}/g, 'where: identifier.customerId ? { customerId: identifier.customerId } : { sessionId: identifier.sessionId }');
code = code.replace(/return this\.getCheckoutSession\(customerId\);/g, 'return this.getCheckoutSession(identifier);');

code = code.replace(/static async updateAddresses\(\n\s+customerId: string,/g, 'static async updateAddresses(\n    identifier: CartIdentifier,');
code = code.replace(/where: \{ id: shippingAddressId, customerId \}/g, 'where: { id: shippingAddressId, customerId: identifier.customerId! }');
code = code.replace(/where: \{ id: billingAddressId, customerId \}/g, 'where: { id: billingAddressId, customerId: identifier.customerId! }');

code = code.replace(/static async completeCheckout\(\n\s+customerId: string,/g, 'static async completeCheckout(\n    identifier: CartIdentifier,');
code = code.replace(/console\.log\(`\[Analytics\] Checkout session captured for customer \$\{customerId\}: clientId=\$\{clientId\}, sessionId=\$\{sessionId\}`\);/g, 
  'console.log(`[Analytics] Checkout session captured for customer ${identifier.customerId || identifier.sessionId}: clientId=${clientId}, sessionId=${sessionId}`);');
code = code.replace(/const session = await this\.getCheckoutSession\(customerId\);/g, 'const session = await this.getCheckoutSession(identifier);');

code = code.replace(/customerId,\n\s+status: "Pending"/g, 'customerId: identifier.customerId || null,\n          status: "Pending"');
code = code.replace(/customerId,\n\s+provider: "COD"/g, 'customerId: identifier.customerId || null,\n          provider: "COD"');

fs.writeFileSync(file, code);
