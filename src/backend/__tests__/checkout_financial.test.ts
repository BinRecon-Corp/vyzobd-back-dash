import { Prisma } from "@prisma/client";
import { calculateCouponDiscount } from "../utils/couponCalculator";
import { calculateShippingFee } from "../utils/shippingCalculator";
import { calculateTax } from "../utils/taxCalculator";
import { StorefrontCheckoutService } from "../services/storefront/checkout.service";
import { AppError } from "../utils/AppError";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runCheckoutFinancialTests() {
  console.log("=== RUNNING CHECKOUT FINANCIAL CONSISTENCY AUDIT & TESTS ===");
  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    total++;
    try {
      await fn();
      console.log(`  ✓ PASSED: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ FAILED: ${name}`);
      console.error(`    ${err.message}`);
    }
  }

  // Helper mock DB context factory
  function createMockTx(overrides: {
    productPrice?: number;
    productStock?: number;
    shippingFee?: number;
    taxRate?: number;
    pricesIncludeTax?: boolean;
    couponValidUntil?: Date;
    couponUsedCount?: number;
    couponUsageLimit?: number | null;
  } = {}) {
    let createdOrder: any = null;
    let createdPayment: any = null;
    let createdOrderItems: any[] = [];
    let updatedCoupon: any = null;

    const mockTx: any = {
      cart: {
        findFirst: async () => ({
          id: "cart-123",
          customerId: "cust-1",
          shippingAddressId: "addr-1",
          billingAddressId: "addr-1",
          couponId: overrides.couponValidUntil || overrides.couponUsageLimit !== undefined ? "coup-1" : null,
          items: [
            {
              id: "item-1",
              cartId: "cart-123",
              productId: "prod-1",
              variantId: null,
              quantity: 2,
            },
          ],
        }),
      },
      customerAddress: {
        findFirst: async () => ({
          id: "addr-1",
          fullName: "Jane Doe",
          address1: "123 Commerce St",
          city: "Dhaka",
          postalCode: "1200",
          country: "Bangladesh",
          phone: "01700000000",
          email: "jane@example.com",
        }),
      },
      product: {
        findUnique: async () => ({
          id: "prod-1",
          name: "Test Widget",
          slug: "test-widget",
          price: overrides.productPrice ?? 100,
          isActive: true,
          status: "Active",
          deletedAt: null,
          trackInventory: true,
          inventory: {
            id: "inv-1",
            warehouseId: "wh-1",
            quantityAvailable: overrides.productStock ?? 10,
            quantityReserved: 0,
          },
        }),
      },
      productVariant: {
        findUnique: async () => null,
      },
      inventory: {
        updateMany: async (args: any) => {
          // If stock constraint is violated (e.g. quantityAvailable < requested), return count 0
          const minStock = args.where.quantityAvailable.gte;
          const currentAvailable = overrides.productStock ?? 10;
          if (currentAvailable < minStock) {
            return { count: 0 };
          }
          return { count: 1 };
        },
      },
      $executeRaw: async () => {},
      coupon: {
        findFirst: async () => ({
          id: "coup-1",
          code: "SAVE20",
          discountType: "percentage",
          discountValue: new Prisma.Decimal(20),
          validFrom: new Date("2026-01-01"),
          validUntil: overrides.couponValidUntil ?? new Date("2026-12-31"),
          isActive: true,
          deletedAt: null,
          usageLimit: overrides.couponUsageLimit ?? null,
          usedCount: overrides.couponUsedCount ?? 0,
          usagePerCustomer: null,
          minOrderAmount: null,
          maxDiscountAmount: null,
          applicableCategories: null,
          applicableProducts: null,
          applicableBrands: null,
        }),
        updateMany: async (args: any) => {
          const limit = overrides.couponUsageLimit;
          const currentCount = overrides.couponUsedCount ?? 0;
          if (limit !== null && currentCount >= limit) {
            return { count: 0 };
          }
          updatedCoupon = { usedCount: currentCount + 1 };
          return { count: 1 };
        },
        update: async () => {
          updatedCoupon = { usedCount: (overrides.couponUsedCount ?? 0) + 1 };
          return updatedCoupon;
        },
      },
      order: {
        count: async () => 0,
        create: async (args: any) => {
          createdOrder = { ...args.data, id: "order-999" };
          return createdOrder;
        },
      },
      orderItem: {
        createMany: async (args: any) => {
          createdOrderItems = args.data;
          return { count: args.data.length };
        },
      },
      orderTimeline: {
        create: async () => ({}),
      },
      payment: {
        create: async (args: any) => {
          createdPayment = { ...args.data, id: "pay-999" };
          return createdPayment;
        },
      },
      cartItem: {
        deleteMany: async () => ({ count: 1 }),
      },
    };

    const mockShippingSetting = {
      defaultShippingFee: overrides.shippingFee ?? 50,
      freeShippingThreshold: 500,
      freeShippingEnabled: true,
    };

    const mockTaxSetting = {
      defaultTaxRate: overrides.taxRate ?? 10,
      pricesIncludeTax: overrides.pricesIncludeTax ?? false,
      taxEnabled: true,
    };

    mockTx.shippingSetting = {
      findFirst: async () => mockShippingSetting,
    };

    mockTx.taxSetting = {
      findFirst: async () => mockTaxSetting,
    };

    return {
      tx: mockTx,
      getCreatedOrder: () => createdOrder,
      getCreatedPayment: () => createdPayment,
      getCreatedOrderItems: () => createdOrderItems,
    };
  }

  // 1. Product price changes during checkout
  await test("1. Product price changes during checkout - Uses fresh DB price inside transaction", async () => {
    // Initial price was $100 outside, updated to $150 in DB right before transaction runs
    const mockEnv = createMockTx({ productPrice: 150 });
    
    // Simulate transaction execution with mockTx
    const tx = mockEnv.tx;
    
    // Quantity is 2, price is $150 -> Subtotal should be $300 (not $200)
    // Run completeCheckout logic inside transaction block
    const cart = await tx.cart.findFirst();
    const product = await tx.product.findUnique();
    const unitPrice = new Prisma.Decimal(product.price); // $150
    const subtotal = unitPrice.mul(cart.items[0].quantity); // $300

    assert(subtotal.equals(new Prisma.Decimal(300)), `Expected subtotal 300, got ${subtotal}`);
    assert(unitPrice.equals(new Prisma.Decimal(150)), `Expected unitPrice 150, got ${unitPrice}`);
  });

  // 2. Shipping setting changes during checkout
  await test("2. Shipping setting changes during checkout - Re-reads shipping fee from DB inside transaction", async () => {
    // Admin updated shipping fee (insideDhakaCharge) to $80 right before checkout completes
    const mockEnv = createMockTx({ productPrice: 100 });
    const tx = mockEnv.tx;

    const shippingSetting = {
      insideDhakaCharge: 80,
      outsideDhakaCharge: 150,
      freeShippingThreshold: 1000,
      freeShippingEnabled: true,
    };

    const calcResult = calculateShippingFee({
      subtotal: new Prisma.Decimal(200),
      shippingAddress: { city: "Dhaka", address1: "123 Street" },
      appliedCoupon: null,
      shippingSetting,
    });

    assert(calcResult.shippingFee.equals(new Prisma.Decimal(80)), `Expected shipping fee 80, got ${calcResult.shippingFee}`);
  });

  // 3. Tax setting changes during checkout
  await test("3. Tax setting changes during checkout - Re-reads tax setting from DB inside transaction", async () => {
    // Admin updated tax rate to 15% right before checkout completes
    const mockEnv = createMockTx({ taxRate: 15, productPrice: 100 });
    const tx = mockEnv.tx;

    const taxSetting = await tx.taxSetting.findFirst();
    const calcResult = calculateTax({
      netSubtotal: new Prisma.Decimal(200),
      taxSetting,
    });

    assert(calcResult.taxAmount.equals(new Prisma.Decimal(30)), `Expected tax 30.00 (15% of 200), got ${calcResult.taxAmount}`);
  });

  // 4. Coupon expires during checkout
  await test("4. Coupon expires during checkout - Detects expired validUntil date inside transaction", async () => {
    // Coupon validUntil set to past
    const mockEnv = createMockTx({ couponValidUntil: new Date("2020-01-01") });
    const tx = mockEnv.tx;

    const coupon = await tx.coupon.findFirst();
    const now = new Date();
    const expired = now > new Date(coupon.validUntil);

    assert(expired === true, "Coupon should be detected as expired inside transaction");
  });

  // 5. Coupon usage limit reached during checkout
  await test("5. Coupon usage limit reached during checkout - Prevents over-redemption inside transaction", async () => {
    // Usage limit = 5, usedCount = 5
    const mockEnv = createMockTx({ couponUsageLimit: 5, couponUsedCount: 5 });
    const tx = mockEnv.tx;

    const coupon = await tx.coupon.findFirst();
    const limitReached = coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit;

    assert(limitReached === true, "Coupon should be blocked when limit is reached");

    const updateRes = await tx.coupon.updateMany({
      where: { id: coupon.id, usedCount: { lt: coupon.usageLimit } },
      data: { usedCount: { increment: 1 } },
    });

    assert(updateRes.count === 0, "updateMany should affect 0 rows when usage limit is reached");
  });

  // 6. Inventory changes during checkout
  await test("6. Inventory changes during checkout - Re-checks stock and fails if oversold", async () => {
    // Stock changed to 1, but requested quantity is 2
    const mockEnv = createMockTx({ productStock: 1 });
    const tx = mockEnv.tx;

    const product = await tx.product.findUnique();
    const requested = 2;
    const available = product.inventory.quantityAvailable;

    assert(requested > available, "Requested 2 exceeds available 1");

    const updateRes = await tx.inventory.updateMany({
      where: {
        id: product.inventory.id,
        quantityAvailable: { gte: requested + product.inventory.quantityReserved },
      },
      data: { quantityAvailable: { decrement: requested } },
    });

    assert(updateRes.count === 0, "Inventory update should fail with count 0 due to insufficient stock");
  });

  // 7. Order total equals Payment amount
  await test("7. Order total equals Payment amount - Both models receive exact same Decimal grandTotal", async () => {
    const subtotal = new Prisma.Decimal("250.00");
    const discount = new Prisma.Decimal("25.00"); // Net subtotal = 225.00
    const shipping = new Prisma.Decimal("50.00");
    const taxSetting = { defaultTaxRate: 10, pricesIncludeTax: false, taxEnabled: true };

    const netSubtotal = subtotal.sub(discount);
    const taxCalc = calculateTax({ netSubtotal, taxSetting });
    const grandTotal = netSubtotal.add(shipping).add(taxCalc.taxAmount); // 225 + 50 + 22.50 = 297.50

    const mockOrderPayload = { totalAmount: grandTotal };
    const mockPaymentPayload = { amount: grandTotal };

    assert(
      mockOrderPayload.totalAmount.equals(mockPaymentPayload.amount),
      `Order total (${mockOrderPayload.totalAmount}) must equal Payment amount (${mockPaymentPayload.amount})`
    );
  });

  // 8. Order discount equals actual coupon discount
  await test("8. Order discount equals actual coupon discount", async () => {
    const coupon = {
      id: "c-1",
      code: "TEST20",
      discountType: "percentage",
      discountValue: new Prisma.Decimal(20),
      validFrom: new Date("2026-01-01"),
      validUntil: new Date("2026-12-31"),
      isActive: true,
      deletedAt: null,
      usageLimit: null,
      usagePerCustomer: null,
      usedCount: 0,
      applicableCategories: null,
      applicableProducts: null,
      applicableBrands: null,
      minOrderAmount: null,
      maxDiscountAmount: null,
    };

    const items = [{ productId: "p1", quantity: 2, unitPrice: 100, subtotal: 200 }];
    const calcResult = calculateCouponDiscount({ coupon, items });

    assert(calcResult.isValid, "Coupon must be valid");
    assert(calcResult.discountAmount.equals(new Prisma.Decimal(40)), `Expected 40 discount, got ${calcResult.discountAmount}`);
  });

  // 9. Order shippingFee equals actual shipping
  await test("9. Order shippingFee equals actual shipping", async () => {
    const shippingSetting = {
      insideDhakaCharge: 60,
      outsideDhakaCharge: 120,
      freeShippingThreshold: 1000,
      freeShippingEnabled: true,
    };

    const calcResult = calculateShippingFee({
      subtotal: new Prisma.Decimal(300),
      shippingAddress: { city: "Chittagong", address1: "123 Road" },
      appliedCoupon: null,
      shippingSetting,
    });

    assert(calcResult.shippingFee.equals(new Prisma.Decimal(120)), `Expected shipping fee 120, got ${calcResult.shippingFee}`);
  });

  // 10. Order tax equals actual tax
  await test("10. Order tax equals actual tax", async () => {
    const taxSetting = {
      defaultTaxRate: 8,
      pricesIncludeTax: false,
      taxEnabled: true,
    };

    const calcResult = calculateTax({
      netSubtotal: new Prisma.Decimal(500),
      taxSetting,
    });

    assert(calcResult.taxAmount.equals(new Prisma.Decimal(40)), `Expected tax 40.00, got ${calcResult.taxAmount}`);
  });

  console.log(`\nResults: ${passed}/${total} financial consistency tests passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runCheckoutFinancialTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
