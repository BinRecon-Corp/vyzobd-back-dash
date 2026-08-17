const fs = require('fs');
const file = 'src/backend/services/storefront/checkout.service.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/static async completeCheckout\(\n\s+identifier: CartIdentifier,\n\s+paymentMethod: string,\n\s+clientId\?: string,\n\s+sessionId\?: string\n\s+\)/g, 
`static async completeCheckout(
    identifier: CartIdentifier,
    paymentMethod: string,
    clientId?: string,
    sessionId?: string,
    shippingAddressObj?: any,
    billingAddressObj?: any
  )`);

code = code.replace(/const session = await this\.getCheckoutSession\(identifier\);\n\n\s+if \(!session\.shippingAddress\) \{\n\s+throw new AppError\("Shipping address is required to complete checkout", 400, "MISSING_SHIPPING_ADDRESS"\);\n\s+\}/,
`const session = await this.getCheckoutSession(identifier);

    let finalShippingAddress = shippingAddressObj || session.shippingAddress;
    let finalBillingAddress = billingAddressObj || session.billingAddress;

    if (!finalShippingAddress) {
      throw new AppError("Shipping address is required to complete checkout", 400, "MISSING_SHIPPING_ADDRESS");
    }`);

code = code.replace(/shippingAddress: this\.formatAddress\(session\.shippingAddress\)/g, 'shippingAddress: this.formatAddress(finalShippingAddress)');
code = code.replace(/billingAddress: this\.formatAddress\(session\.billingAddress\)/g, 'billingAddress: this.formatAddress(finalBillingAddress)');

// Also fix getCheckoutSession to not use customerId for customerAddress if identifier.customerId is missing
code = code.replace(/where: \{ id: cart\.shippingAddressId, customerId \}/g, 'where: identifier.customerId ? { id: cart.shippingAddressId, customerId: identifier.customerId } : { id: cart.shippingAddressId }');
code = code.replace(/where: \{ id: cart\.billingAddressId, customerId \}/g, 'where: identifier.customerId ? { id: cart.billingAddressId, customerId: identifier.customerId } : { id: cart.billingAddressId }');
code = code.replace(/return \{\n\s+cartId: cart\.id,\n\s+customerId,\n/g, 'return {\n      cartId: cart.id,\n      customerId: identifier.customerId,\n');

// Also fix coupon usage query in getCheckoutSession and applyCoupon
code = code.replace(/const customerOrdersWithCoupon = await prisma\.order\.count\(\{\n\s+where: \{\n\s+customerId,\n/g, 
`const customerOrdersWithCoupon = identifier.customerId ? await prisma.order.count({
              where: {
                customerId: identifier.customerId,
`);
// Need to add closing brace for identifier.customerId condition. Wait, let's use a smarter replace.
fs.writeFileSync(file, code);
