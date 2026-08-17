import sys
import re

with open('src/backend/services/storefront/checkout.service.ts', 'r') as f:
    content = f.read()

# 1. Fix getCheckoutSession inventory logic
target1 = """      // Inventory check
      if (product.trackInventory) {
        let availableStock = 0;
        if (variant) {
          const totalStock = variant.inventories.reduce(
            (sum: number, inv: any) => sum + (inv.quantityAvailable - inv.quantityReserved),
            0
          );
          availableStock = Math.max(0, totalStock);
        } else if (product.inventory) {"""

replacement1 = """      // Inventory check
      if (product.trackInventory) {
        let availableStock = 0;
        if (variant) {
          let totalStock = variant.inventories.reduce(
            (sum: number, inv: any) => sum + (inv.quantityAvailable - inv.quantityReserved),
            0
          );
          if (totalStock === 0 && variant.inventories.length === 0 && product.inventory) {
            totalStock = product.inventory.quantityAvailable - product.inventory.quantityReserved;
          }
          availableStock = Math.max(0, totalStock);
        } else if (product.inventory) {"""
content = content.replace(target1, replacement1)

# 2. Add shippingMethod to getCheckoutSession return
target2 = """      paymentMethod: cart.paymentMethod,
    };"""

replacement2 = """      paymentMethod: cart.paymentMethod,
      shippingMethod: shipping.equals(0) ? "free" : "standard",
    };"""
content = content.replace(target2, replacement2)


# 3. Add payment method validation early in completeCheckout
target3 = """  static async completeCheckout(
    identifier: CartIdentifier,
    paymentMethod: string,
    clientId?: string,
    sessionId?: string,
    shippingAddressObj?: any,
    billingAddressObj?: any
  ) {
    // Capture clientId and sessionId from checkout payload for analytics scope
    if (clientId || sessionId) {
      console.log(`[Analytics] Checkout session captured for customer ${identifier.customerId || identifier.sessionId}: clientId=${clientId}, sessionId=${sessionId}`);
    }"""

replacement3 = """  static async completeCheckout(
    identifier: CartIdentifier,
    paymentMethod: string,
    clientId?: string,
    sessionId?: string,
    shippingAddressObj?: any,
    billingAddressObj?: any
  ) {
    // Capture clientId and sessionId from checkout payload for analytics scope
    if (clientId || sessionId) {
      console.log(`[Analytics] Checkout session captured for customer ${identifier.customerId || identifier.sessionId}: clientId=${clientId}, sessionId=${sessionId}`);
    }

    const supportedProviders = ["COD", "STRIPE", "BKASH", "NAGAD", "SSLCOMMERZ"];
    const normalizedPaymentMethod = (paymentMethod || "").toUpperCase();
    if (!supportedProviders.includes(normalizedPaymentMethod)) {
      throw new AppError(`Invalid payment method: ${paymentMethod}`, 400, "INVALID_PAYMENT_METHOD");
    }"""
content = content.replace(target3, replacement3)

# 4. Use normalizedPaymentMethod in tx.order.create
target4 = """          billingAddress: this.formatAddress(finalBillingAddress),
          paymentMethod,
          couponId: session.coupon?.id || null,"""
replacement4 = """          billingAddress: this.formatAddress(finalBillingAddress),
          paymentMethod: normalizedPaymentMethod,
          couponId: session.coupon?.id || null,"""
content = content.replace(target4, replacement4)


# 5. Fix completeCheckout stock validation and atomic deduction
target5 = """            const availableStock = variant.inventories.reduce(
              (sum: number, inv: any) => sum + (inv.quantityAvailable - inv.quantityReserved),
              0
            );

            if (item.quantity > availableStock) {
              throw new AppError(`Stock for "${item.productName}" variant changed. Available: ${availableStock}, Requested: ${item.quantity}`, 409, "INSUFFICIENT_STOCK");
            }

            // Deduct inventory quantityAvailable inside transaction
            // Variant inventories can be spread across warehouses, let's pick the first one with enough stock or standard warehouse
            const targetInventory = variant.inventories.find(
              (inv: any) => (inv.quantityAvailable - inv.quantityReserved) >= item.quantity
            ) || variant.inventories[0];

            if (targetInventory) {
              const updated = await tx.inventory.updateMany({
                where: { 
                  id: targetInventory.id,
                  quantityAvailable: { gte: item.quantity + targetInventory.quantityReserved }
                },
                data: {
                  quantityAvailable: { decrement: item.quantity },
                },
              });
              if (updated.count === 0) {
                throw new AppError(`Insufficient stock for "${item.productName}" during checkout. Please try again.`, 409, "INSUFFICIENT_STOCK");
              }
            }"""

replacement5 = """            let availableStock = variant.inventories.reduce(
              (sum: number, inv: any) => sum + (inv.quantityAvailable - inv.quantityReserved),
              0
            );
            
            const useFallback = availableStock === 0 && variant.inventories.length === 0 && product.inventory;
            if (useFallback) {
              availableStock = product.inventory.quantityAvailable - product.inventory.quantityReserved;
            }

            if (item.quantity > availableStock) {
              throw new AppError(`Stock for "${item.productName}" variant changed. Available: ${availableStock}, Requested: ${item.quantity}`, 409, "INSUFFICIENT_STOCK");
            }

            // Deduct inventory quantityAvailable inside transaction
            if (useFallback) {
              const updated = await tx.inventory.updateMany({
                where: { 
                  id: product.inventory.id,
                  quantityAvailable: { gte: item.quantity + product.inventory.quantityReserved }
                },
                data: {
                  quantityAvailable: { decrement: item.quantity },
                },
              });
              if (updated.count === 0) {
                throw new AppError(`Insufficient stock for "${item.productName}" during checkout. Please try again.`, 409, "INSUFFICIENT_STOCK");
              }
            } else {
              // Variant inventories can be spread across warehouses, let's pick the first one with enough stock or standard warehouse
              const targetInventory = variant.inventories.find(
                (inv: any) => (inv.quantityAvailable - inv.quantityReserved) >= item.quantity
              ) || variant.inventories[0];

              if (targetInventory) {
                const updated = await tx.inventory.updateMany({
                  where: { 
                    id: targetInventory.id,
                    quantityAvailable: { gte: item.quantity + targetInventory.quantityReserved }
                  },
                  data: {
                    quantityAvailable: { decrement: item.quantity },
                  },
                });
                if (updated.count === 0) {
                  throw new AppError(`Insufficient stock for "${item.productName}" during checkout. Please try again.`, 409, "INSUFFICIENT_STOCK");
                }
              }
            }"""
content = content.replace(target5, replacement5)

# 6. Fix provider in tx.payment.create
target6 = """      // Create COD Payment record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          customerId: identifier.customerId || null,
          provider: "COD",
          amount: session.grandTotal,
          currency: "USD",
          status: "PENDING",
        }
      });"""

replacement6 = """      // Create Payment record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          customerId: identifier.customerId || null,
          provider: normalizedPaymentMethod as any,
          amount: session.grandTotal,
          currency: "USD",
          status: "PENDING",
        }
      });"""
content = content.replace(target6, replacement6)

with open('src/backend/services/storefront/checkout.service.ts', 'w') as f:
    f.write(content)

print("Checkout replaced successfully")
