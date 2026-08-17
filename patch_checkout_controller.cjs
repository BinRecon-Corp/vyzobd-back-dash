const fs = require('fs');
const file = 'src/backend/controllers/storefront/checkout.controller.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/const customerId = req\.customer!\.id;/g, `const customerId = req.customer?.id;
    const guestSessionId = req.headers["x-cart-session-id"] as string | undefined;
    if (!customerId && !guestSessionId) {
      return res.status(400).json({ status: "error", message: "Missing session identifier" });
    }
    const identifier = customerId ? { customerId } : { sessionId: guestSessionId! };`);

code = code.replace(/StorefrontCheckoutService\.getCheckoutSession\(customerId\)/g, 'StorefrontCheckoutService.getCheckoutSession(identifier)');
code = code.replace(/StorefrontCheckoutService\.applyCoupon\(customerId,/g, 'StorefrontCheckoutService.applyCoupon(identifier,');
code = code.replace(/StorefrontCheckoutService\.updateAddresses\(\s+customerId,/g, 'StorefrontCheckoutService.updateAddresses(\n      identifier,');
code = code.replace(/StorefrontCheckoutService\.completeCheckout\(customerId,/g, 'StorefrontCheckoutService.completeCheckout(identifier,');

fs.writeFileSync(file, code);
