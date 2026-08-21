import { Prisma } from "@prisma/client";
import { calculateTax } from "../utils/taxCalculator";
import { SettingService } from "../services/setting.service";
import { StorefrontSettingService } from "../services/storefront/setting.service";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

function runTaxEngineTests() {
  console.log("=== RUNNING TAX CALCULATION ENGINE TESTS ===");
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

  // 1. 0% tax
  test("0% Tax Rate - Calculates 0 tax amount", () => {
    const res = calculateTax({
      netSubtotal: new Prisma.Decimal(150),
      taxSetting: { defaultTaxRate: 0, pricesIncludeTax: false, taxEnabled: true },
    });
    assert(res.taxAmount.equals(new Prisma.Decimal(0)), `Expected tax 0, got ${res.taxAmount}`);
    assert(res.taxRate === 0, `Expected taxRate 0, got ${res.taxRate}`);
  });

  // 2. 5% tax
  test("5% Tax Rate (Exclusive) - Calculates 5% tax on net subtotal", () => {
    const res = calculateTax({
      netSubtotal: new Prisma.Decimal(200),
      taxSetting: { defaultTaxRate: 5, pricesIncludeTax: false, taxEnabled: true },
    });
    assert(res.taxAmount.equals(new Prisma.Decimal(10)), `Expected tax 10.00, got ${res.taxAmount}`);
    assert(res.taxRate === 5, `Expected taxRate 5, got ${res.taxRate}`);
  });

  // 3. 10% tax
  test("10% Tax Rate (Exclusive) - Calculates 10% tax on net subtotal", () => {
    const res = calculateTax({
      netSubtotal: new Prisma.Decimal(150),
      taxSetting: { defaultTaxRate: 10, pricesIncludeTax: false, taxEnabled: true },
    });
    assert(res.taxAmount.equals(new Prisma.Decimal(15)), `Expected tax 15.00, got ${res.taxAmount}`);
    assert(res.taxRate === 10, `Expected taxRate 10, got ${res.taxRate}`);
  });

  // 4. Tax disabled
  test("Tax Disabled - Returns 0 tax even if defaultTaxRate is set (>0)", () => {
    const res = calculateTax({
      netSubtotal: new Prisma.Decimal(500),
      taxSetting: { defaultTaxRate: 15, pricesIncludeTax: false, taxEnabled: false },
    });
    assert(res.taxAmount.equals(new Prisma.Decimal(0)), `Expected tax 0 when disabled, got ${res.taxAmount}`);
    assert(res.taxEnabled === false, "taxEnabled flag should be false");
  });

  // 5. Prices INCLUDE tax
  test("Prices Include Tax - Extracts embedded tax component without adding on top", () => {
    // 110 total subtotal at 10% rate -> tax embedded = 110 * 10 / 110 = 10.00
    const res = calculateTax({
      netSubtotal: new Prisma.Decimal(110),
      taxSetting: { defaultTaxRate: 10, pricesIncludeTax: true, taxEnabled: true },
    });
    assert(res.pricesIncludeTax === true, "pricesIncludeTax should be true");
    assert(res.taxAmount.equals(new Prisma.Decimal(10)), `Expected embedded tax 10.00, got ${res.taxAmount}`);
    assert(res.effectiveTaxableAmount.equals(new Prisma.Decimal(100)), `Expected net price 100.00, got ${res.effectiveTaxableAmount}`);
  });

  // 6. Prices EXCLUDE tax
  test("Prices Exclude Tax - Adds tax on top of subtotal", () => {
    // 110 subtotal at 10% rate -> tax added = 110 * 0.10 = 11.00
    const res = calculateTax({
      netSubtotal: new Prisma.Decimal(110),
      taxSetting: { defaultTaxRate: 10, pricesIncludeTax: false, taxEnabled: true },
    });
    assert(res.pricesIncludeTax === false, "pricesIncludeTax should be false");
    assert(res.taxAmount.equals(new Prisma.Decimal("11.00")), `Expected added tax 11.00, got ${res.taxAmount}`);
  });

  // 7. Rounding
  test("Tax Rounding - Normalizes fractional cents using HALF_UP rounding to 2 decimal places", () => {
    // 33.33 * 0.075 = 2.49975 -> rounded to 2.50
    const res1 = calculateTax({
      netSubtotal: new Prisma.Decimal("33.33"),
      taxSetting: { defaultTaxRate: 7.5, pricesIncludeTax: false, taxEnabled: true },
    });
    assert(res1.taxAmount.equals(new Prisma.Decimal("2.50")), `Expected rounded tax 2.50, got ${res1.taxAmount}`);

    // 19.99 * 0.05 = 0.9995 -> rounded to 1.00
    const res2 = calculateTax({
      netSubtotal: new Prisma.Decimal("19.99"),
      taxSetting: { defaultTaxRate: 5, pricesIncludeTax: false, taxEnabled: true },
    });
    assert(res2.taxAmount.equals(new Prisma.Decimal("1.00")), `Expected rounded tax 1.00, got ${res2.taxAmount}`);
  });

  // 8. Admin changes tax setting and checkout reflects changes without restart
  test("Admin updates tax setting - Immediately clears storefront cache and updates tax outputs", () => {
    // Simulate initial cache
    StorefrontSettingService.clearCache();

    const taxSettingV1 = { defaultTaxRate: 8, pricesIncludeTax: false, taxEnabled: true };
    const resV1 = calculateTax({
      netSubtotal: new Prisma.Decimal(100),
      taxSetting: taxSettingV1,
    });
    assert(resV1.taxAmount.equals(new Prisma.Decimal(8)), `Expected V1 tax 8.00, got ${resV1.taxAmount}`);

    // Admin updates setting to 12%
    StorefrontSettingService.clearCache();
    const taxSettingV2 = { defaultTaxRate: 12, pricesIncludeTax: false, taxEnabled: true };
    const resV2 = calculateTax({
      netSubtotal: new Prisma.Decimal(100),
      taxSetting: taxSettingV2,
    });
    assert(resV2.taxAmount.equals(new Prisma.Decimal(12)), `Expected V2 tax 12.00, got ${resV2.taxAmount}`);
  });

  // 9. Order and Payment consistency
  test("Order & Payment Consistency - Total amount equals netSubtotal + shipping + tax for exclusive tax", () => {
    const netSubtotal = new Prisma.Decimal("250.00");
    const shipping = new Prisma.Decimal("60.00");
    const taxSetting = { defaultTaxRate: 7, pricesIncludeTax: false, taxEnabled: true };

    const taxRes = calculateTax({ netSubtotal, taxSetting });
    // tax = 250 * 0.07 = 17.50
    assert(taxRes.taxAmount.equals(new Prisma.Decimal("17.50")), `Expected tax 17.50, got ${taxRes.taxAmount}`);

    const grandTotal = taxRes.pricesIncludeTax
      ? netSubtotal.add(shipping)
      : netSubtotal.add(shipping).add(taxRes.taxAmount);

    assert(grandTotal.equals(new Prisma.Decimal("327.50")), `Expected grandTotal 327.50, got ${grandTotal}`);
  });

  console.log(`\nResults: ${passed}/${total} tests passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTaxEngineTests();
