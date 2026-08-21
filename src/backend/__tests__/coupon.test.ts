import { Prisma } from "@prisma/client";
import { calculateCouponDiscount, isItemEligibleForCoupon, parseJsonArray, CouponModel, CartItemForCoupon } from "../utils/couponCalculator";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function runCouponTests() {
  console.log("=== RUNNING COUPON ENGINE UNIT TESTS ===");
  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void) {
    total++;
    try {
      fn();
      console.log(`  ✓ PASSED: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ FAILED: ${name}`);
      console.error(`    ${err.message}`);
    }
  }

  // Base coupon helper
  const now = new Date("2026-08-21T12:00:00Z");
  const baseCoupon: CouponModel = {
    id: "c-123",
    code: "TEST10",
    discountType: "percentage",
    discountValue: new Prisma.Decimal(10),
    validFrom: new Date("2026-01-01"),
    validUntil: new Date("2026-12-31"),
    isActive: true,
    deletedAt: null,
    minOrderAmount: null,
    maxDiscountAmount: null,
    usageLimit: null,
    usagePerCustomer: null,
    usedCount: 0,
    applicableCategories: null,
    applicableProducts: null,
    applicableBrands: null,
  };

  // 1. Percentage Coupon Test
  test("Percentage Coupon - Calculates exact percentage off eligible subtotal", () => {
    const coupon = { ...baseCoupon, discountValue: new Prisma.Decimal(15) };
    const items: CartItemForCoupon[] = [
      { productId: "p1", quantity: 2, unitPrice: 100, subtotal: 200 }, // 200
    ];
    const res = calculateCouponDiscount({ coupon, items, now });
    assert(res.isValid, "Should be valid");
    assert(res.discountAmount.equals(new Prisma.Decimal(30)), `Expected discount 30, got ${res.discountAmount}`);
  });

  // 2. Fixed Coupon Test
  test("Fixed Coupon - Flat discount off subtotal", () => {
    const coupon = { ...baseCoupon, discountType: "fixed", discountValue: new Prisma.Decimal(50) };
    const items: CartItemForCoupon[] = [
      { productId: "p1", quantity: 1, unitPrice: 200, subtotal: 200 },
    ];
    const res = calculateCouponDiscount({ coupon, items, now });
    assert(res.isValid, "Should be valid");
    assert(res.discountAmount.equals(new Prisma.Decimal(50)), `Expected discount 50, got ${res.discountAmount}`);
  });

  // 3. Free Shipping Coupon Test
  test("Free Shipping Coupon - Flags free shipping and 0 monetary discount", () => {
    const coupon = { ...baseCoupon, discountType: "free_shipping", discountValue: new Prisma.Decimal(0) };
    const items: CartItemForCoupon[] = [
      { productId: "p1", quantity: 1, unitPrice: 150, subtotal: 150 },
    ];
    const res = calculateCouponDiscount({ coupon, items, now });
    assert(res.isValid, "Should be valid");
    assert(res.isFreeShipping === true, "Should set isFreeShipping to true");
    assert(res.discountAmount.equals(new Prisma.Decimal(0)), "Discount amount should be 0");
  });

  // 4. Max Discount Cap Test
  test("Max Discount Cap - Percentage discount capped by maxDiscountAmount", () => {
    const coupon = {
      ...baseCoupon,
      discountType: "percentage",
      discountValue: new Prisma.Decimal(50), // 50% of 1000 = 500
      maxDiscountAmount: new Prisma.Decimal(200), // Capped at 200
    };
    const items: CartItemForCoupon[] = [
      { productId: "p1", quantity: 1, unitPrice: 1000, subtotal: 1000 },
    ];
    const res = calculateCouponDiscount({ coupon, items, now });
    assert(res.isValid, "Should be valid");
    assert(res.discountAmount.equals(new Prisma.Decimal(200)), `Expected max capped discount 200, got ${res.discountAmount}`);
  });

  // 5. Product Restriction Test
  test("Product Restriction - Applies discount ONLY to restricted product", () => {
    const coupon = {
      ...baseCoupon,
      discountType: "percentage",
      discountValue: new Prisma.Decimal(10), // 10%
      applicableProducts: JSON.stringify(["p1"]),
    };
    const items: CartItemForCoupon[] = [
      { productId: "p1", quantity: 1, unitPrice: 500, subtotal: 500 },  // Eligible
      { productId: "p2", quantity: 1, unitPrice: 5000, subtotal: 5000 }, // NOT eligible
    ];
    const res = calculateCouponDiscount({ coupon, items, now });
    assert(res.isValid, "Should be valid");
    assert(res.eligibleSubtotal.equals(new Prisma.Decimal(500)), `Expected eligible subtotal 500, got ${res.eligibleSubtotal}`);
    assert(res.discountAmount.equals(new Prisma.Decimal(50)), `Expected discount 50 (10% of 500), got ${res.discountAmount}`);
  });

  // 6. Category Restriction Test
  test("Category Restriction - Applies discount ONLY to items in restricted category", () => {
    const coupon = {
      ...baseCoupon,
      discountType: "fixed",
      discountValue: new Prisma.Decimal(100),
      applicableCategories: JSON.stringify(["cat-shoes"]),
    };
    const items: CartItemForCoupon[] = [
      { productId: "p1", categoryId: "cat-shoes", quantity: 1, unitPrice: 400, subtotal: 400 }, // Eligible
      { productId: "p2", categoryId: "cat-shirts", quantity: 1, unitPrice: 800, subtotal: 800 }, // NOT eligible
    ];
    const res = calculateCouponDiscount({ coupon, items, now });
    assert(res.isValid, "Should be valid");
    assert(res.eligibleSubtotal.equals(new Prisma.Decimal(400)), `Expected eligible subtotal 400, got ${res.eligibleSubtotal}`);
    assert(res.discountAmount.equals(new Prisma.Decimal(100)), `Expected discount 100, got ${res.discountAmount}`);
  });

  // 7. Brand Restriction Test
  test("Brand Restriction - Applies discount ONLY to items of restricted brand", () => {
    const coupon = {
      ...baseCoupon,
      discountType: "percentage",
      discountValue: new Prisma.Decimal(20),
      applicableBrands: JSON.stringify(["brand-nike"]),
    };
    const items: CartItemForCoupon[] = [
      { productId: "p1", brandId: "brand-nike", quantity: 1, unitPrice: 1000, subtotal: 1000 }, // Eligible (20% = 200)
      { productId: "p2", brandId: "brand-puma", quantity: 1, unitPrice: 2000, subtotal: 2000 }, // NOT eligible
    ];
    const res = calculateCouponDiscount({ coupon, items, now });
    assert(res.isValid, "Should be valid");
    assert(res.eligibleSubtotal.equals(new Prisma.Decimal(1000)), `Expected eligible subtotal 1000, got ${res.eligibleSubtotal}`);
    assert(res.discountAmount.equals(new Prisma.Decimal(200)), `Expected discount 200, got ${res.discountAmount}`);
  });

  // 8. Mixed Eligible & Non-Eligible Cart Test
  test("Mixed Cart - Discount is NOT calculated against non-eligible items", () => {
    const coupon = {
      ...baseCoupon,
      discountType: "percentage",
      discountValue: new Prisma.Decimal(10),
      applicableProducts: JSON.stringify(["p-eligible"]),
    };
    const items: CartItemForCoupon[] = [
      { productId: "p-eligible", quantity: 1, unitPrice: 500, subtotal: 500 },
      { productId: "p-other-1", quantity: 1, unitPrice: 3000, subtotal: 3000 },
      { productId: "p-other-2", quantity: 1, unitPrice: 2000, subtotal: 2000 },
    ];
    const res = calculateCouponDiscount({ coupon, items, now });
    assert(res.isValid, "Should be valid");
    assert(res.totalCartSubtotal.equals(new Prisma.Decimal(5500)), `Total cart subtotal expected 5500, got ${res.totalCartSubtotal}`);
    assert(res.eligibleSubtotal.equals(new Prisma.Decimal(500)), `Eligible subtotal expected 500, got ${res.eligibleSubtotal}`);
    assert(res.discountAmount.equals(new Prisma.Decimal(50)), `Discount expected 50 (10% of 500), got ${res.discountAmount}`);
  });

  // 9. Coupon Discount Greater than Eligible Subtotal
  test("Fixed Discount Greater than Eligible Subtotal - Discount is capped at eligible subtotal", () => {
    const coupon = {
      ...baseCoupon,
      discountType: "fixed",
      discountValue: new Prisma.Decimal(1000), // $1000 discount off $300 item
    };
    const items: CartItemForCoupon[] = [
      { productId: "p1", quantity: 1, unitPrice: 300, subtotal: 300 },
    ];
    const res = calculateCouponDiscount({ coupon, items, now });
    assert(res.isValid, "Should be valid");
    assert(res.discountAmount.equals(new Prisma.Decimal(300)), `Expected capped discount 300, got ${res.discountAmount}`);
  });

  // 10. Expired Coupon Test
  test("Expired Coupon - Fails validation", () => {
    const coupon = {
      ...baseCoupon,
      validUntil: new Date("2025-12-31"), // Expired
    };
    const items: CartItemForCoupon[] = [{ productId: "p1", quantity: 1, unitPrice: 100, subtotal: 100 }];
    const res = calculateCouponDiscount({ coupon, items, now });
    assert(!res.isValid, "Should be invalid");
    assert(res.errorCode === "EXPIRED_COUPON", `Expected EXPIRED_COUPON error, got ${res.errorCode}`);
  });

  // 11. Future Coupon Test
  test("Future Coupon - Fails validation", () => {
    const coupon = {
      ...baseCoupon,
      validFrom: new Date("2027-01-01"), // Future
    };
    const items: CartItemForCoupon[] = [{ productId: "p1", quantity: 1, unitPrice: 100, subtotal: 100 }];
    const res = calculateCouponDiscount({ coupon, items, now });
    assert(!res.isValid, "Should be invalid");
    assert(res.errorCode === "EXPIRED_COUPON", `Expected EXPIRED_COUPON error, got ${res.errorCode}`);
  });

  // 12. Inactive Coupon Test
  test("Inactive Coupon - Fails validation", () => {
    const coupon = {
      ...baseCoupon,
      isActive: false,
    };
    const items: CartItemForCoupon[] = [{ productId: "p1", quantity: 1, unitPrice: 100, subtotal: 100 }];
    const res = calculateCouponDiscount({ coupon, items, now });
    assert(!res.isValid, "Should be invalid");
    assert(res.errorCode === "INVALID_COUPON", `Expected INVALID_COUPON error, got ${res.errorCode}`);
  });

  // 13. Usage Limit Reached Test
  test("Global Usage Limit Reached - Fails validation", () => {
    const coupon = {
      ...baseCoupon,
      usageLimit: 10,
      usedCount: 10,
    };
    const items: CartItemForCoupon[] = [{ productId: "p1", quantity: 1, unitPrice: 100, subtotal: 100 }];
    const res = calculateCouponDiscount({ coupon, items, now });
    assert(!res.isValid, "Should be invalid");
    assert(res.errorCode === "LIMIT_REACHED", `Expected LIMIT_REACHED error, got ${res.errorCode}`);
  });

  // 14. Customer Usage Limit Reached Test
  test("Customer Usage Limit Reached - Fails validation for customer", () => {
    const coupon = {
      ...baseCoupon,
      usagePerCustomer: 1,
    };
    const items: CartItemForCoupon[] = [{ productId: "p1", quantity: 1, unitPrice: 100, subtotal: 100 }];
    const res = calculateCouponDiscount({
      coupon,
      items,
      customerId: "cust-999",
      customerOrderCountWithCoupon: 1, // Already used once
      now,
    });
    assert(!res.isValid, "Should be invalid");
    assert(res.errorCode === "CUSTOMER_LIMIT_REACHED", `Expected CUSTOMER_LIMIT_REACHED error, got ${res.errorCode}`);
  });

  // 15. Min Order Amount Test
  test("Min Order Amount - Fails when subtotal < minOrderAmount", () => {
    const coupon = {
      ...baseCoupon,
      minOrderAmount: new Prisma.Decimal(1000),
    };
    const items: CartItemForCoupon[] = [{ productId: "p1", quantity: 1, unitPrice: 500, subtotal: 500 }];
    const res = calculateCouponDiscount({ coupon, items, now });
    assert(!res.isValid, "Should be invalid");
    assert(res.errorCode === "MIN_AMOUNT_NOT_MET", `Expected MIN_AMOUNT_NOT_MET error, got ${res.errorCode}`);
  });

  // 16. 2-Decimal Precision & Rounding Test
  test("2-Decimal Precision - Rounds fractional cents correctly", () => {
    const coupon = {
      ...baseCoupon,
      discountType: "percentage",
      discountValue: new Prisma.Decimal(15), // 15% of $33.33 = 4.9995 -> 5.00
    };
    const items: CartItemForCoupon[] = [{ productId: "p1", quantity: 1, unitPrice: 33.33, subtotal: 33.33 }];
    const res = calculateCouponDiscount({ coupon, items, now });
    assert(res.isValid, "Should be valid");
    assert(res.discountAmount.equals(new Prisma.Decimal(5.00)), `Expected 5.00, got ${res.discountAmount}`);
  });

  console.log(`\nResults: ${passed}/${total} tests passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runCouponTests();
