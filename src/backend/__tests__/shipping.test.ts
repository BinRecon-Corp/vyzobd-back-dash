import { Prisma } from "@prisma/client";
import { calculateShippingFee, determineDeliveryZone } from "../utils/shippingCalculator";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function runShippingEngineTests() {
  console.log("=== RUNNING SHIPPING CALCULATION ENGINE TESTS ===");
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

  const baseSettings = {
    insideDhakaCharge: 60,
    outsideDhakaCharge: 120,
    freeShippingThreshold: 2000,
    freeShippingEnabled: true,
  };

  // 1. Dhaka below threshold
  test("Dhaka below threshold - Charges standard Inside Dhaka rate (৳60)", () => {
    const res = calculateShippingFee({
      subtotal: new Prisma.Decimal(1000),
      shippingAddress: { city: "Dhaka", address1: "House 10, Road 2, Dhanmondi" },
      shippingSetting: baseSettings,
    });
    assert(res.deliveryZone === "INSIDE_DHAKA", `Expected INSIDE_DHAKA, got ${res.deliveryZone}`);
    assert(res.shippingFee.equals(new Prisma.Decimal(60)), `Expected shipping 60, got ${res.shippingFee}`);
    assert(res.isFreeShipping === false, "Should not be free shipping");
  });

  // 2. Outside Dhaka below threshold
  test("Outside Dhaka below threshold - Charges standard Outside Dhaka rate (৳120)", () => {
    const res = calculateShippingFee({
      subtotal: new Prisma.Decimal(1000),
      shippingAddress: { city: "Chittagong", address1: "GEC Circle, Nasirabad" },
      shippingSetting: baseSettings,
    });
    assert(res.deliveryZone === "OUTSIDE_DHAKA", `Expected OUTSIDE_DHAKA, got ${res.deliveryZone}`);
    assert(res.shippingFee.equals(new Prisma.Decimal(120)), `Expected shipping 120, got ${res.shippingFee}`);
    assert(res.isFreeShipping === false, "Should not be free shipping");
  });

  // 3. Dhaka at threshold
  test("Dhaka at threshold - Waives shipping when subtotal >= freeShippingThreshold", () => {
    const res = calculateShippingFee({
      subtotal: new Prisma.Decimal(2000),
      shippingAddress: { city: "Dhaka", address1: "Block C, Mirpur 10" },
      shippingSetting: baseSettings,
    });
    assert(res.deliveryZone === "INSIDE_DHAKA", `Expected INSIDE_DHAKA, got ${res.deliveryZone}`);
    assert(res.shippingFee.equals(new Prisma.Decimal(0)), `Expected shipping 0, got ${res.shippingFee}`);
    assert(res.isFreeShipping === true, "Should be free shipping");
    assert(res.freeShippingReason === "THRESHOLD", `Expected THRESHOLD reason, got ${res.freeShippingReason}`);
  });

  // 4. Outside Dhaka at threshold
  test("Outside Dhaka at threshold - Waives shipping for outer districts when subtotal >= threshold", () => {
    const res = calculateShippingFee({
      subtotal: new Prisma.Decimal(2000),
      shippingAddress: { city: "Sylhet", address1: "Zindabazar Point" },
      shippingSetting: baseSettings,
    });
    assert(res.deliveryZone === "OUTSIDE_DHAKA", `Expected OUTSIDE_DHAKA, got ${res.deliveryZone}`);
    assert(res.shippingFee.equals(new Prisma.Decimal(0)), `Expected shipping 0, got ${res.shippingFee}`);
    assert(res.isFreeShipping === true, "Should be free shipping");
    assert(res.freeShippingReason === "THRESHOLD", `Expected THRESHOLD reason, got ${res.freeShippingReason}`);
  });

  // 5. Above threshold
  test("Above threshold - Waives shipping when subtotal strictly exceeds threshold", () => {
    const res = calculateShippingFee({
      subtotal: new Prisma.Decimal(3500),
      shippingAddress: { city: "Rajshahi", address1: "Shaheb Bazar" },
      shippingSetting: baseSettings,
    });
    assert(res.shippingFee.equals(new Prisma.Decimal(0)), `Expected shipping 0, got ${res.shippingFee}`);
    assert(res.isFreeShipping === true, "Should be free shipping");
  });

  // 6. Incomplete address
  test("Incomplete address - Safely defaults to Outside Dhaka rate (৳120) and flags incomplete", () => {
    const res = calculateShippingFee({
      subtotal: new Prisma.Decimal(1000),
      shippingAddress: { address1: "" }, // Empty/incomplete address
      shippingSetting: baseSettings,
    });
    assert(res.isAddressComplete === false, "Address should be flagged as incomplete");
    assert(res.deliveryZone === "UNKNOWN", `Expected UNKNOWN zone, got ${res.deliveryZone}`);
    assert(res.shippingFee.equals(new Prisma.Decimal(120)), `Expected default outside rate 120, got ${res.shippingFee}`);
  });

  // 7. Invalid district / unknown zone
  test("Invalid district - Safely handles unknown zone by applying outside charge (never undercharges)", () => {
    const res = calculateShippingFee({
      subtotal: new Prisma.Decimal(1000),
      shippingAddress: { city: "UnknownRandomLocation", address1: "Main Street" },
      shippingSetting: baseSettings,
    });
    assert(res.deliveryZone === "OUTSIDE_DHAKA", `Expected OUTSIDE_DHAKA, got ${res.deliveryZone}`);
    assert(res.shippingFee.equals(new Prisma.Decimal(120)), `Expected shipping 120, got ${res.shippingFee}`);
  });

  // 8. Misleading "Dhaka" text in address
  test("Misleading 'Dhaka' text in street line or division - Prevents false positive Dhaka matches", () => {
    // Case A: Street line contains "Dhaka Road" in Chittagong
    const resA = calculateShippingFee({
      subtotal: new Prisma.Decimal(1000),
      shippingAddress: { city: "Chittagong", address1: "123 Dhaka Road, Agrabad" },
      shippingSetting: baseSettings,
    });
    assert(resA.deliveryZone === "OUTSIDE_DHAKA", `Case A: Expected OUTSIDE_DHAKA, got ${resA.deliveryZone}`);
    assert(resA.shippingFee.equals(new Prisma.Decimal(120)), `Case A: Expected shipping 120, got ${resA.shippingFee}`);

    // Case B: Gazipur city with state "Dhaka" (Gazipur is in Dhaka division, but outside Dhaka city!)
    const resB = calculateShippingFee({
      subtotal: new Prisma.Decimal(1000),
      shippingAddress: { city: "Gazipur", state: "Dhaka", address1: "North Dhaka Housing, Station Road" },
      shippingSetting: baseSettings,
    });
    assert(resB.deliveryZone === "OUTSIDE_DHAKA", `Case B: Expected OUTSIDE_DHAKA, got ${resB.deliveryZone}`);
    assert(resB.shippingFee.equals(new Prisma.Decimal(120)), `Case B: Expected shipping 120, got ${resB.shippingFee}`);
  });

  // 9. Free shipping disabled
  test("Free shipping disabled - Charges normal shipping even when subtotal exceeds threshold", () => {
    const res = calculateShippingFee({
      subtotal: new Prisma.Decimal(3000),
      shippingAddress: { city: "Dhaka", address1: "Road 27, Dhanmondi" },
      shippingSetting: { ...baseSettings, freeShippingEnabled: false },
    });
    assert(res.shippingFee.equals(new Prisma.Decimal(60)), `Expected shipping 60, got ${res.shippingFee}`);
    assert(res.isFreeShipping === false, "Should not be free shipping when rule is disabled");
  });

  // 10. Free shipping coupon
  test("Free shipping coupon - Waives shipping charge regardless of subtotal or zone", () => {
    const res = calculateShippingFee({
      subtotal: new Prisma.Decimal(500), // Below 2000 threshold
      shippingAddress: { city: "Sylhet", address1: "Subidbazar" },
      appliedCoupon: { discountType: "free_shipping", isFreeShipping: true },
      shippingSetting: baseSettings,
    });
    assert(res.shippingFee.equals(new Prisma.Decimal(0)), `Expected shipping 0, got ${res.shippingFee}`);
    assert(res.isFreeShipping === true, "Should be free shipping");
    assert(res.freeShippingReason === "COUPON", `Expected COUPON reason, got ${res.freeShippingReason}`);
  });

  // 11. Admin rate change
  test("Admin rate change - Dynamic setting updates take immediate effect without backend restart", () => {
    const customSettings = {
      insideDhakaCharge: 80,
      outsideDhakaCharge: 150,
      freeShippingThreshold: 2500,
      freeShippingEnabled: true,
    };

    const resDhaka = calculateShippingFee({
      subtotal: new Prisma.Decimal(1000),
      shippingAddress: { city: "Dhaka", address1: "Gulshan 2" },
      shippingSetting: customSettings,
    });
    assert(resDhaka.shippingFee.equals(new Prisma.Decimal(80)), `Expected updated Dhaka rate 80, got ${resDhaka.shippingFee}`);

    const resOuter = calculateShippingFee({
      subtotal: new Prisma.Decimal(1000),
      shippingAddress: { city: "Chittagong", address1: "Agrabad" },
      shippingSetting: customSettings,
    });
    assert(resOuter.shippingFee.equals(new Prisma.Decimal(150)), `Expected updated Outside rate 150, got ${resOuter.shippingFee}`);
  });

  // 12. Storefront settings response
  test("Storefront settings response - Formats shipping config for client API DTO", () => {
    const settingsDTO = {
      insideDhakaCharge: 80,
      outsideDhakaCharge: 150,
      freeShippingThreshold: 2500,
      freeShippingEnabled: true,
      currency: "BDT",
    };

    assert(settingsDTO.insideDhakaCharge === 80, "Inside charge should be 80");
    assert(settingsDTO.outsideDhakaCharge === 150, "Outside charge should be 150");
    assert(settingsDTO.freeShippingThreshold === 2500, "Threshold should be 2500");
    assert(settingsDTO.currency === "BDT", "Currency should be BDT");
  });

  console.log(`\nResults: ${passed}/${total} tests passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runShippingEngineTests();
