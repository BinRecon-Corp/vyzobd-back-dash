import { Prisma } from '@prisma/client';
import { prisma } from "../../config/db";
import { AppError } from "../../utils/AppError";

import { mapOrderToStorefrontDTO } from "../../dtos/storefront/mappers";

export class StorefrontCheckoutService {
  /**
   * Helper to format CustomerAddress model into a readable text block
   */
  private static formatAddress(address: any): string {
    if (!address) return "";
    return `${address.fullName}\n${address.address1}${address.address2 ? ", " + address.address2 : ""}\n${address.city}, ${address.state} ${address.postalCode}\n${address.country}\nPhone: ${address.phone || "N/A"}`;
  }

  /**
   * Retrieves or initializes the checkout session details and calculates all fees.
   * Never trusts the frontend, calculates everything dynamically.
   */
  static async getCheckoutSession(customerId: string) {
    const cart = await prisma.cart.findUnique({
      where: { customerId },
      include: {
        items: {
          include: {
            product: {
              include: {
                inventory: true,
              },
            },
            variant: {
              include: {
                inventories: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError("Your cart is empty", 400, "EMPTY_CART");
    }

    // 1. Validate each item is active, variants are valid, and inventory is sufficient
    const validatedItems = [];
    let subtotal = new Prisma.Decimal(0);

    for (const item of cart.items) {
      const { product, variant, quantity } = item;

      // Product validation
      if (!product || !product.isActive || product.status !== "Active" || product.deletedAt) {
        throw new AppError(`Product "${product?.name || "Unknown"}" is no longer active or available`, 400, "PRODUCT_UNAVAILABLE");
      }

      // Variant validation if applicable
      if (item.variantId) {
        if (!variant || !variant.isActive || variant.deletedAt) {
          throw new AppError(`Selected variant for "${product.name}" is no longer active or available`, 400, "VARIANT_UNAVAILABLE");
        }
      }

      // Inventory check
      if (product.trackInventory) {
        let availableStock = 0;
        if (variant) {
          const totalStock = variant.inventories.reduce(
            (sum: number, inv: any) => sum + (inv.quantityAvailable - inv.quantityReserved),
            0
          );
          availableStock = Math.max(0, totalStock);
        } else if (product.inventory) {
          availableStock = Math.max(
            0,
            product.inventory.quantityAvailable - product.inventory.quantityReserved
          );
        }

        if (quantity > availableStock) {
          throw new AppError(
            `Insufficient stock for "${product.name}". Available: ${availableStock}, Requested: ${quantity}`,
            400,
            "INSUFFICIENT_STOCK"
          );
        }
      }

      // Pricing calculation
      const unitPrice = variant ? new Prisma.Decimal(variant.price) : new Prisma.Decimal(product.price || 0);
      const itemSubtotal = unitPrice.mul(quantity);
      subtotal = subtotal.add(itemSubtotal);

      validatedItems.push({
        id: item.id,
        productId: item.productId,
        productName: product.name,
        productSlug: product.slug,
        variantId: item.variantId,
        variantSku: variant?.sku || null,
        quantity,
        unitPrice,
        subtotal: itemSubtotal,
      });
    }

    // 2. Validate and calculate Coupon Discount
    let discount = new Prisma.Decimal(0);
    let appliedCoupon = null;

    if (cart.couponId) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          id: cart.couponId,
          isActive: true,
          deletedAt: null,
        },
      });

      if (coupon) {
        const now = new Date();
        const validFrom = new Date(coupon.validFrom);
        const validUntil = new Date(coupon.validUntil);

        if (now >= validFrom && now <= validUntil) {
          let isCouponValid = true;

          // Usage limits
          if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
            isCouponValid = false;
          }

          // Per-customer usage limit
          if (isCouponValid && coupon.usagePerCustomer !== null) {
            const customerOrdersWithCoupon = await prisma.order.count({
              where: {
                customerId,
                couponId: coupon.id,
              },
            });
            if (customerOrdersWithCoupon >= coupon.usagePerCustomer) {
              isCouponValid = false;
            }
          }

          // Min order amount check
          if (isCouponValid && coupon.minOrderAmount !== null) {
            if (subtotal.lt(new Prisma.Decimal(coupon.minOrderAmount))) {
              isCouponValid = false;
            }
          }

          if (isCouponValid) {
            appliedCoupon = {
              id: coupon.id,
              code: coupon.code,
              discountType: coupon.discountType,
              discountValue: new Prisma.Decimal(coupon.discountValue),
            };

            if (coupon.discountType === "percentage") {
              const calcDiscount = subtotal.mul(new Prisma.Decimal(coupon.discountValue)).div(100);
              discount = coupon.maxDiscountAmount
                ? Prisma.Decimal.min(calcDiscount, new Prisma.Decimal(coupon.maxDiscountAmount))
                : calcDiscount;
            } else if (coupon.discountType === "fixed") {
              discount = Prisma.Decimal.min(new Prisma.Decimal(coupon.discountValue), subtotal);
            } else if (coupon.discountType === "free_shipping") {
              // Free shipping handled inside shipping block
            }
          } else {
            // Remove invalid/expired coupon automatically from cart session
            await prisma.cart.update({
              where: { customerId },
              data: { couponId: null },
            });
          }
        } else {
          // Expirations expired or not started yet
          await prisma.cart.update({
            where: { customerId },
            data: { couponId: null },
          });
        }
      }
    }

    // 3. Address validations
    let shippingAddress = null;
    let billingAddress = null;

    if (cart.shippingAddressId) {
      shippingAddress = await prisma.customerAddress.findFirst({
        where: { id: cart.shippingAddressId, customerId },
      });
    }

    if (cart.billingAddressId) {
      billingAddress = await prisma.customerAddress.findFirst({
        where: { id: cart.billingAddressId, customerId },
      });
    }

    // 4. Calculate Shipping Fees (flat shipping rate, free shipping if subtotal >= 150 or free_shipping coupon applied)
    const isFreeShippingCoupon = cart.couponId && appliedCoupon?.discountType === "free_shipping";
    const shipping = subtotal.gte(150) || isFreeShippingCoupon ? new Prisma.Decimal(0) : new Prisma.Decimal(15);

    // 5. Calculate Tax Rate (Flat 10% tax rate applied to net subtotal)
    const netSubtotal = Prisma.Decimal.max(0, subtotal.sub(discount));
    const tax = netSubtotal.mul(0.1).toDecimalPlaces(2);

    // 6. Calculate Grand Total
    const grandTotal = netSubtotal.add(shipping).add(tax);

    return {
      cartId: cart.id,
      customerId,
      items: validatedItems,
      subtotal,
      discount,
      shipping,
      tax,
      grandTotal,
      coupon: appliedCoupon,
      shippingAddress,
      billingAddress,
      paymentMethod: cart.paymentMethod,
    };
  }

  /**
   * Applies a coupon code to the user checkout session
   */
  static async applyCoupon(customerId: string, couponCode: string) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: { equals: couponCode, mode: "insensitive" },
        isActive: true,
        deletedAt: null,
      },
    });

    if (!coupon) {
      throw new AppError("Coupon is invalid, inactive, or expired", 404, "INVALID_COUPON");
    }

    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (now < validFrom || now > validUntil) {
      throw new AppError("Coupon has expired or is not yet active", 400, "EXPIRED_COUPON");
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new AppError("Coupon usage limit has been reached", 400, "LIMIT_REACHED");
    }

    // Verify per customer limits
    if (coupon.usagePerCustomer !== null) {
      const customerOrdersWithCoupon = await prisma.order.count({
        where: {
          customerId,
          couponId: coupon.id,
        },
      });
      if (customerOrdersWithCoupon >= coupon.usagePerCustomer) {
        throw new AppError("You have reached the maximum usage limit for this coupon", 400, "CUSTOMER_LIMIT_REACHED");
      }
    }

    // Get cart to check minOrderAmount
    const cart = await prisma.cart.findUnique({
      where: { customerId },
      include: {
        items: {
          include: {
            product: { select: { price: true } },
            variant: { select: { price: true } },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError("Cart is empty", 400, "EMPTY_CART");
    }

    let cartSubtotal = new Prisma.Decimal(0);
    for (const item of cart.items) {
      const price = item.variant ? new Prisma.Decimal(item.variant.price) : new Prisma.Decimal(item.product.price || 0);
      cartSubtotal = cartSubtotal.add(price.mul(item.quantity));
    }

    if (coupon.minOrderAmount !== null && cartSubtotal.lt(new Prisma.Decimal(coupon.minOrderAmount))) {
      throw new AppError(`Minimum order amount of $${coupon.minOrderAmount} is required to apply this coupon`, 400, "MIN_AMOUNT_NOT_MET");
    }

    // Update cart with applied coupon
    await prisma.cart.update({
      where: { customerId },
      data: { couponId: coupon.id },
    });

    return this.getCheckoutSession(customerId);
  }

  /**
   * Saves shipping and billing address selections to user's cart session
   */
  static async updateAddresses(
    customerId: string,
    shippingAddressId: string,
    billingAddressId?: string
  ) {
    const shippingAddress = await prisma.customerAddress.findFirst({
      where: { id: shippingAddressId, customerId },
    });

    if (!shippingAddress) {
      throw new AppError("Shipping address not found or unauthorized", 404, "ADDRESS_NOT_FOUND");
    }

    let resolvedBillingAddressId = shippingAddressId;

    if (billingAddressId) {
      const billingAddress = await prisma.customerAddress.findFirst({
        where: { id: billingAddressId, customerId },
      });

      if (!billingAddress) {
        throw new AppError("Billing address not found or unauthorized", 404, "ADDRESS_NOT_FOUND");
      }
      resolvedBillingAddressId = billingAddressId;
    }

    await prisma.cart.update({
      where: { customerId },
      data: {
        shippingAddressId,
        billingAddressId: resolvedBillingAddressId,
      },
    });

    return this.getCheckoutSession(customerId);
  }

  /**
   * Places the order, updates inventories, clears the cart inside a Prisma transaction
   */
  static async completeCheckout(customerId: string, paymentMethod: string) {
    // 1. Load active checkout session (validates active products, variant statuses, and current stock)
    const session = await this.getCheckoutSession(customerId);

    if (!session.shippingAddress) {
      throw new AppError("Shipping address is required to complete checkout", 400, "MISSING_SHIPPING_ADDRESS");
    }

    // 2. Perform checkout completion within a strict database transaction
    const order = await prisma.$transaction(async (tx) => {
      // Re-read stock/inventory levels inside the transaction block to prevent concurrent oversell
      for (const item of session.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { inventory: true },
        });

        if (!product || !product.isActive || product.status !== "Active" || product.deletedAt) {
          throw new AppError(`Product "${item.productName}" has become unavailable`, 400, "PRODUCT_UNAVAILABLE");
        }

        if (product.trackInventory) {
          if (item.variantId) {
            const variant = await tx.productVariant.findUnique({
              where: { id: item.variantId },
              include: { inventories: true },
            });

            if (!variant || !variant.isActive || variant.deletedAt) {
              throw new AppError(`Variant of "${item.productName}" has become unavailable`, 400, "VARIANT_UNAVAILABLE");
            }

            const availableStock = variant.inventories.reduce(
              (sum: number, inv: any) => sum + (inv.quantityAvailable - inv.quantityReserved),
              0
            );

            if (item.quantity > availableStock) {
              throw new AppError(`Stock for "${item.productName}" variant changed. Available: ${availableStock}, Requested: ${item.quantity}`, 400, "INSUFFICIENT_STOCK");
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
                throw new AppError(`Insufficient stock for "${item.productName}" during checkout. Please try again.`, 400, "INSUFFICIENT_STOCK");
              }
            }
          } else {
            // Check direct product inventory
            if (!product.inventory) {
              throw new AppError(`Inventory tracking is enabled but no inventory record found for "${product.name}"`, 400, "INSUFFICIENT_STOCK");
            }

            const availableStock = product.inventory.quantityAvailable - product.inventory.quantityReserved;

            if (item.quantity > availableStock) {
              throw new AppError(`Stock for "${product.name}" changed. Available: ${availableStock}, Requested: ${item.quantity}`, 400, "INSUFFICIENT_STOCK");
            }

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
              throw new AppError(`Insufficient stock for "${product.name}" during checkout. Please try again.`, 400, "INSUFFICIENT_STOCK");
            }
          }
        }
      }

      // If coupon used, validate and increment usedCount inside transaction
      if (session.coupon) {
        const coupon = await tx.coupon.findUnique({
          where: { id: session.coupon.id },
        });

        if (!coupon || !coupon.isActive || coupon.deletedAt) {
          throw new AppError("Coupon is no longer available", 400, "COUPON_UNAVAILABLE");
        }

        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
          throw new AppError("Coupon usage limit exceeded", 400, "COUPON_LIMIT_REACHED");
        }

        if (coupon.usageLimit !== null) {
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
        }
      }

      // Generate secure unique Order Number
      const randomPart = Math.floor(100000 + Math.random() * 900000);
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${randomPart}`;

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          status: "Pending",
          paymentStatus: "Unpaid",
          totalAmount: session.grandTotal,
          shippingAddress: this.formatAddress(session.shippingAddress),
          billingAddress: this.formatAddress(session.billingAddress),
          paymentMethod,
          couponId: session.coupon?.id || null,
        },
      });

      // Create Order Items
      const orderItemPayloads = session.items.map((item) => ({
        orderId: newOrder.id,
        productId: item.productId,
        productVariantId: item.variantId || null,
        quantity: item.quantity,
        price: item.unitPrice,
      }));

      await tx.orderItem.createMany({
        data: orderItemPayloads,
      });

      // Log Order Timeline Event
      await tx.orderTimeline.create({
        data: {
          orderId: newOrder.id,
          status: "Pending",
          action: "Order successfully placed and checked out.",
        },
      });

      // Reset / Clear cart items and coupon/addresses in database
      await tx.cartItem.deleteMany({
        where: { cartId: session.cartId },
      });

      await tx.cart.update({
        where: { id: session.cartId },
        data: {
          couponId: null,
          shippingAddressId: null,
          billingAddressId: null,
          paymentMethod: null,
        },
      });

      return newOrder;
    });

    return mapOrderToStorefrontDTO(order);
  }
}
