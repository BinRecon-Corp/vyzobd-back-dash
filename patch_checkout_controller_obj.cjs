const fs = require('fs');
const file = 'src/backend/controllers/storefront/checkout.controller.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/const \{ paymentMethod, clientId, sessionId \} = req\.body;/g, 'const { paymentMethod, clientId, sessionId, shippingAddress, billingAddress } = req.body;');
code = code.replace(/StorefrontCheckoutService\.completeCheckout\(identifier, paymentMethod, clientId, sessionId\)/g, 'StorefrontCheckoutService.completeCheckout(identifier, paymentMethod, clientId, sessionId, shippingAddress, billingAddress)');

fs.writeFileSync(file, code);
