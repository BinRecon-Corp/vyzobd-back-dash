import assert from "assert";
import express from "express";
import request from "supertest";
import { Prisma } from "@prisma/client";
import { StorefrontSettingService } from "../services/storefront/setting.service";
import { SettingService } from "../services/setting.service";
import { calculateShippingFee } from "../utils/shippingCalculator";
import storefrontSettingRouter from "../routes/storefront/setting.routes";
import { prisma } from "../config/db";

// In-memory mock database state for settings and audit logs
let mockShippingSetting: any = {
  id: "shipping-setting-1",
  insideDhakaCharge: 60,
  outsideDhakaCharge: 120,
  defaultShippingCost: 60,
  freeShippingThreshold: 2000,
  freeShippingEnabled: true,
  enableFreeShipping: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

let mockBrandingSetting: any = {
  id: "branding-1",
  siteName: "Enterprise Test Store",
  siteTitle: "Enterprise Test Portal",
  siteTagline: "Fast & Reliable",
  logoUrl: "https://example.com/logo.png",
  faviconUrl: "https://example.com/favicon.ico",
  adminPanelName: "Admin Suite",
  adminPanelLogo: "https://example.com/admin-logo.png",
  primaryColor: "#0f172a",
  footerText: "© 2026 Enterprise Store",
  defaultLanguage: "en",
  defaultCurrency: "BDT",
  defaultTimezone: "Asia/Dhaka",
};

let mockTaxSetting: any = {
  id: "tax-1",
  defaultTaxRate: 5,
  taxEnabled: true,
  enableTax: true,
  pricesIncludeTax: false,
};

let mockSMTPSetting: any = {
  id: "smtp-1",
  host: "smtp.mailgun.org",
  port: 587,
  username: "secret_user",
  password: "super_secret_smtp_password_123!",
  fromEmail: "admin@enterprisestore.com",
  fromName: "Store Admin",
  secure: true,
  enabled: true,
};

let mockSecuritySetting: any = {
  id: "security-1",
  enable2FA: true,
  passwordMinLength: 8,
  sessionTimeoutMinutes: 60,
  maxLoginAttempts: 5,
  enableMaintenanceMode: false,
};

let mockActivityLogs: any[] = [];

// Intercept prisma delegates
(prisma as any).shippingSetting = {
  findFirst: async () => mockShippingSetting ? { ...mockShippingSetting } : null,
  create: async (args: any) => {
    mockShippingSetting = { id: "shipping-setting-1", ...args.data, createdAt: new Date(), updatedAt: new Date() };
    return { ...mockShippingSetting };
  },
  update: async (args: any) => {
    mockShippingSetting = { ...mockShippingSetting, ...args.data, updatedAt: new Date() };
    return { ...mockShippingSetting };
  },
};

(prisma as any).brandingSetting = {
  findFirst: async () => mockBrandingSetting ? { ...mockBrandingSetting } : null,
  create: async (args: any) => { mockBrandingSetting = { ...args.data }; return mockBrandingSetting; },
  update: async (args: any) => { mockBrandingSetting = { ...mockBrandingSetting, ...args.data }; return mockBrandingSetting; },
};

(prisma as any).taxSetting = {
  findFirst: async () => mockTaxSetting ? { ...mockTaxSetting } : null,
  create: async (args: any) => { mockTaxSetting = { ...args.data }; return mockTaxSetting; },
  update: async (args: any) => { mockTaxSetting = { ...mockTaxSetting, ...args.data }; return mockTaxSetting; },
};

(prisma as any).sEOSetting = {
  findFirst: async () => ({
    robotsTxt: "User-agent: *\nDisallow: /admin/",
  }),
};

(prisma as any).analyticsSetting = {
  findFirst: async () => null,
};

(prisma as any).storeSetting = {
  findFirst: async () => ({ whatsappOrderNumber: "+8801700000000", callOrderNumber: "+8801800000000" }),
};

(prisma as any).sMTPSetting = {
  findFirst: async () => mockSMTPSetting ? { ...mockSMTPSetting } : null,
};

(prisma as any).securitySetting = {
  findFirst: async () => mockSecuritySetting ? { ...mockSecuritySetting } : null,
};

(prisma as any).activityLog = {
  create: async (args: any) => {
    mockActivityLogs.push(args.data);
    return { id: "log-" + Date.now(), ...args.data };
  },
};

let totalPassed = 0;
let totalFailed = 0;

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`  ✓ PASSED: ${name}`);
    totalPassed++;
  } catch (err: any) {
    console.error(`  ✗ FAILED: ${name}`);
    console.error(`    Error: ${err.message || err}`);
    totalFailed++;
  }
}

async function runStorefrontSettingsVerification() {
  console.log("=========================================================");
  console.log("RUNNING STOREFRONT SETTINGS API AUDIT & CONSISTENCY TESTS");
  console.log("=========================================================");

  // Reset initial settings
  mockShippingSetting = {
    id: "shipping-setting-1",
    insideDhakaCharge: 60,
    outsideDhakaCharge: 120,
    defaultShippingCost: 60,
    freeShippingThreshold: 2000,
    freeShippingEnabled: true,
    enableFreeShipping: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  StorefrontSettingService.clearCache();

  // Setup express test app for storefront endpoints
  const app = express();
  app.use(express.json());
  app.use("/api/storefront/v1/settings", storefrontSettingRouter);

  // ---------------------------------------------------------
  // SUITE 1: Baseline 60 / 120 / 2000 Verification
  // ---------------------------------------------------------
  console.log("\n--- Suite 1: Initial Shipping Rates (60 / 120 / 2000) ---");

  await test("1.1 Storefront Public Settings API exposes baseline shipping (60 / 120 / 2000 / BDT)", async () => {
    const publicSettings = await StorefrontSettingService.getPublicSettings();
    assert(publicSettings.shipping, "Shipping object must exist in public settings");
    assert.strictEqual(publicSettings.shipping.insideDhakaCharge, 60, "insideDhakaCharge should be 60");
    assert.strictEqual(publicSettings.shipping.outsideDhakaCharge, 120, "outsideDhakaCharge should be 120");
    assert.strictEqual(publicSettings.shipping.freeShippingThreshold, 2000, "freeShippingThreshold should be 2000");
    assert.strictEqual(publicSettings.shipping.freeShippingEnabled, true, "freeShippingEnabled should be true");
    assert.strictEqual(publicSettings.shipping.currency, "BDT", "Currency must be BDT");
  });

  await test("1.2 Storefront Dedicated Shipping API endpoint (/settings/shipping) returns identical config", async () => {
    const shippingSettings = await StorefrontSettingService.getShippingSettings();
    assert.strictEqual(shippingSettings.insideDhakaCharge, 60, "insideDhakaCharge should be 60");
    assert.strictEqual(shippingSettings.outsideDhakaCharge, 120, "outsideDhakaCharge should be 120");
    assert.strictEqual(shippingSettings.freeShippingThreshold, 2000, "freeShippingThreshold should be 2000");
    assert.strictEqual(shippingSettings.freeShippingEnabled, true, "freeShippingEnabled should be true");
    assert.strictEqual(shippingSettings.currency, "BDT", "Currency must be BDT");
  });

  await test("1.3 HTTP GET /api/storefront/v1/settings/public returns 200 OK with correct JSON shape", async () => {
    const res = await request(app).get("/api/storefront/v1/settings/public");
    assert.strictEqual(res.status, 200, "Should return 200 status");
    assert.strictEqual(res.body.status, "success", "Should have status: success");
    assert.strictEqual(res.body.data.shipping.insideDhakaCharge, 60);
    assert.strictEqual(res.body.data.shipping.outsideDhakaCharge, 120);
    assert.strictEqual(res.body.data.shipping.freeShippingThreshold, 2000);
    assert.strictEqual(res.body.data.shipping.freeShippingEnabled, true);
    assert.strictEqual(res.body.data.shipping.currency, "BDT");

    // Audit branding completeness
    assert(res.body.data.branding, "branding must be present");
    assert(res.body.data.branding.siteName, "siteName must not be empty or null");
    assert(res.body.data.branding.siteTitle, "siteTitle must not be empty or null");
    assert(res.body.data.branding.siteDescription, "siteDescription must not be empty or null");

    // Audit SEO completeness
    assert(res.body.data.seo, "seo must be present");
    assert(res.body.data.seo.metaTitle, "metaTitle must not be empty or null");
    assert(res.body.data.seo.metaDescription, "metaDescription must not be empty or null");
    assert(res.body.data.seo.robotsTxt, "robotsTxt must not be empty or null");

    // Audit Store contact completeness
    assert(res.body.data.store, "store contact must be present");
    assert.strictEqual(res.body.data.store.whatsappOrderNumber, "+8801700000000");
  });

  await test("1.4 HTTP GET /api/storefront/v1/settings/shipping returns 200 OK with granular shipping payload", async () => {
    const res = await request(app).get("/api/storefront/v1/settings/shipping");
    assert.strictEqual(res.status, 200, "Should return 200 status");
    assert.strictEqual(res.body.status, "success", "Should have status: success");
    assert.strictEqual(res.body.data.insideDhakaCharge, 60);
    assert.strictEqual(res.body.data.outsideDhakaCharge, 120);
    assert.strictEqual(res.body.data.freeShippingThreshold, 2000);
    assert.strictEqual(res.body.data.freeShippingEnabled, true);
    assert.strictEqual(res.body.data.currency, "BDT");
  });

  await test("1.5 Checkout calculation matches 60 / 120 / 2000 source of truth", async () => {
    const freshDbSetting = await prisma.shippingSetting.findFirst();

    // Inside Dhaka (৳1500 subtotal) -> ৳60
    const insideDhakaRes = calculateShippingFee({
      subtotal: 1500,
      shippingAddress: { district: "Dhaka", address1: "Gulshan-2" },
      shippingSetting: freshDbSetting,
    });
    assert.strictEqual(insideDhakaRes.shippingFee.toNumber(), 60, "Inside Dhaka shipping should be 60");
    assert.strictEqual(insideDhakaRes.isFreeShipping, false, "Should not be free shipping below 2000");

    // Outside Dhaka (৳1500 subtotal) -> ৳120
    const outsideDhakaRes = calculateShippingFee({
      subtotal: 1500,
      shippingAddress: { district: "Chittagong", address1: "Agrabad" },
      shippingSetting: freshDbSetting,
    });
    assert.strictEqual(outsideDhakaRes.shippingFee.toNumber(), 120, "Outside Dhaka shipping should be 120");
    assert.strictEqual(outsideDhakaRes.isFreeShipping, false, "Should not be free shipping below 2000");

    // Reaching 2000 threshold -> ৳0 (Free Shipping)
    const thresholdRes = calculateShippingFee({
      subtotal: 2000,
      shippingAddress: { district: "Dhaka", address1: "Gulshan-2" },
      shippingSetting: freshDbSetting,
    });
    assert.strictEqual(thresholdRes.shippingFee.toNumber(), 0, "Shipping should be 0 at 2000 threshold");
    assert.strictEqual(thresholdRes.isFreeShipping, true, "Should qualify for free shipping");
    assert.strictEqual(thresholdRes.freeShippingReason, "THRESHOLD", "Reason should be THRESHOLD");
  });

  // ---------------------------------------------------------
  // SUITE 2: Dynamic Admin Update to 80 / 150 / 3000
  // ---------------------------------------------------------
  console.log("\n--- Suite 2: Dynamic Admin Rate Change to 80 / 150 / 3000 ---");

  await test("2.1 Admin updates rates to 80 / 150 / 3000 via SettingService", async () => {
    const updated = await SettingService.updateShipping({
      insideDhakaCharge: 80,
      outsideDhakaCharge: 150,
      freeShippingThreshold: 3000,
      freeShippingEnabled: true,
    }, "admin-user-1");

    assert.strictEqual(updated.insideDhakaCharge, 80);
    assert.strictEqual(updated.outsideDhakaCharge, 150);
    assert.strictEqual(updated.freeShippingThreshold, 3000);
    assert.strictEqual(updated.freeShippingEnabled, true);
  });

  await test("2.2 Storefront Settings API immediately reflects 80 / 150 / 3000 without server restart", async () => {
    // Calling Storefront Settings directly without restarting anything
    const publicSettings = await StorefrontSettingService.getPublicSettings();
    assert.strictEqual(publicSettings.shipping.insideDhakaCharge, 80, "insideDhakaCharge should now be 80");
    assert.strictEqual(publicSettings.shipping.outsideDhakaCharge, 150, "outsideDhakaCharge should now be 150");
    assert.strictEqual(publicSettings.shipping.freeShippingThreshold, 3000, "freeShippingThreshold should now be 3000");
    assert.strictEqual(publicSettings.shipping.freeShippingEnabled, true);
    assert.strictEqual(publicSettings.shipping.currency, "BDT");

    const shippingSettings = await StorefrontSettingService.getShippingSettings();
    assert.strictEqual(shippingSettings.insideDhakaCharge, 80, "Dedicated method should return 80");
    assert.strictEqual(shippingSettings.outsideDhakaCharge, 150, "Dedicated method should return 150");
    assert.strictEqual(shippingSettings.freeShippingThreshold, 3000, "Dedicated method should return 3000");
  });

  await test("2.3 HTTP endpoints immediately reflect updated 80 / 150 / 3000 rates", async () => {
    const resPublic = await request(app).get("/api/storefront/v1/settings/public");
    assert.strictEqual(resPublic.status, 200);
    assert.strictEqual(resPublic.body.data.shipping.insideDhakaCharge, 80);
    assert.strictEqual(resPublic.body.data.shipping.outsideDhakaCharge, 150);
    assert.strictEqual(resPublic.body.data.shipping.freeShippingThreshold, 3000);

    const resShipping = await request(app).get("/api/storefront/v1/settings/shipping");
    assert.strictEqual(resShipping.status, 200);
    assert.strictEqual(resShipping.body.data.insideDhakaCharge, 80);
    assert.strictEqual(resShipping.body.data.outsideDhakaCharge, 150);
    assert.strictEqual(resShipping.body.data.freeShippingThreshold, 3000);
  });

  await test("2.4 Checkout calculations immediately adopt updated 80 / 150 / 3000 rates", async () => {
    const freshDbSetting = await prisma.shippingSetting.findFirst();

    // Inside Dhaka (৳2000 subtotal) -> Now charges ৳80 because threshold is now 3000!
    const insideDhaka2000 = calculateShippingFee({
      subtotal: 2000,
      shippingAddress: { district: "Dhaka", address1: "Gulshan-2" },
      shippingSetting: freshDbSetting,
    });
    assert.strictEqual(insideDhaka2000.shippingFee.toNumber(), 80, "At 2000 subtotal, shipping must now be ৳80 under new ৳3000 threshold");
    assert.strictEqual(insideDhaka2000.isFreeShipping, false, "2000 is below 3000 threshold");

    // Outside Dhaka (৳2000 subtotal) -> Charges ৳150
    const outsideDhaka2000 = calculateShippingFee({
      subtotal: 2000,
      shippingAddress: { district: "Sylhet", address1: "Zindabazar" },
      shippingSetting: freshDbSetting,
    });
    assert.strictEqual(outsideDhaka2000.shippingFee.toNumber(), 150, "Outside Dhaka shipping must now be ৳150");
    assert.strictEqual(outsideDhaka2000.isFreeShipping, false);

    // Reaching new 3000 threshold -> ৳0
    const threshold3000 = calculateShippingFee({
      subtotal: 3000,
      shippingAddress: { district: "Dhaka", address1: "Gulshan-2" },
      shippingSetting: freshDbSetting,
    });
    assert.strictEqual(threshold3000.shippingFee.toNumber(), 0, "Shipping must be ৳0 at new 3000 threshold");
    assert.strictEqual(threshold3000.isFreeShipping, true);
    assert.strictEqual(threshold3000.freeShippingReason, "THRESHOLD");
  });

  // ---------------------------------------------------------
  // SUITE 3: Security, Sensitive Data Exclusion & Secret Auditing
  // ---------------------------------------------------------
  console.log("\n--- Suite 3: Security & Secret Leakage Prevention ---");

  await test("3.1 Public settings strictly omit SMTP credentials and passwords", async () => {
    const publicSettings = await StorefrontSettingService.getPublicSettings();
    assert.strictEqual((publicSettings as any).smtp, undefined, "smtp object must NOT be exposed");
    assert.strictEqual((publicSettings as any).password, undefined, "Passwords must NOT be exposed");
    assert.strictEqual((publicSettings as any).mailHost, undefined);

    const jsonStr = JSON.stringify(publicSettings);
    assert(!jsonStr.includes("super_secret_smtp_password_123!"), "SMTP password must never be in JSON output");
    assert(!jsonStr.includes("secret_user"), "SMTP username must not leak in public settings");
  });

  await test("3.2 Public settings strictly omit database internal IDs and timestamps in shipping payload", async () => {
    const publicSettings = await StorefrontSettingService.getPublicSettings();
    const shipping = publicSettings.shipping;
    assert.strictEqual((shipping as any).id, undefined, "Database internal ID must NOT be exposed in shipping");
    assert.strictEqual((shipping as any).createdAt, undefined, "createdAt must NOT be exposed in shipping");
    assert.strictEqual((shipping as any).updatedAt, undefined, "updatedAt must NOT be exposed in shipping");
  });

  await test("3.3 Security, 2FA, session timeout, and login attempts settings are NOT exposed to storefront", async () => {
    const publicSettings = await StorefrontSettingService.getPublicSettings();
    assert.strictEqual((publicSettings as any).security, undefined, "Security settings must NOT be in public settings");
    assert.strictEqual((publicSettings as any).sessionTimeoutMinutes, undefined);
    assert.strictEqual((publicSettings as any).maxLoginAttempts, undefined);
  });

  // ---------------------------------------------------------
  // SUITE 4: Cache Lifecycle & Consistency Verification
  // ---------------------------------------------------------
  console.log("\n--- Suite 4: Cache Lifecycle & Cache Invalidation ---");

  await test("4.1 Cache serves repeated requests within TTL without corrupting values", async () => {
    const firstCall = await StorefrontSettingService.getPublicSettings();
    const secondCall = await StorefrontSettingService.getPublicSettings();
    assert.strictEqual(firstCall.shipping.insideDhakaCharge, secondCall.shipping.insideDhakaCharge);
    assert.strictEqual(firstCall.shipping.outsideDhakaCharge, secondCall.shipping.outsideDhakaCharge);
  });

  await test("4.2 Explicit clearCache forces fresh read from database", async () => {
    mockShippingSetting.insideDhakaCharge = 90;
    StorefrontSettingService.clearCache();
    const fresh = await StorefrontSettingService.getPublicSettings();
    assert.strictEqual(fresh.shipping.insideDhakaCharge, 90, "After clearCache, immediately returns fresh DB value (90)");
  });

  // ---------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------
  console.log("\n=========================================================");
  console.log(`TEST SUMMARY: ${totalPassed}/${totalPassed + totalFailed} Passed, ${totalFailed} Failed`);
  console.log("=========================================================");

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runStorefrontSettingsVerification().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
