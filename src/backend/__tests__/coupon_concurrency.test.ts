import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { calculateCouponDiscount, CouponModel } from "../utils/couponCalculator";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

/**
 * In-memory thread-safe transactional store simulating PostgreSQL FOR UPDATE locks
 * and Prisma atomic transactions for unit testing concurrency logic.
 */
class MemoryCouponStore {
  coupons = new Map<string, any>();
  orders: any[] = [];
  carts = new Map<string, any[]>();
  locks = new Map<string, Promise<void>>();

  async acquireLock(couponId: string) {
    while (this.locks.has(couponId)) {
      await this.locks.get(couponId);
    }
    let resolveLock!: () => void;
    const lockPromise = new Promise<void>((res) => { resolveLock = res; });
    this.locks.set(couponId, lockPromise);
    return () => {
      this.locks.delete(couponId);
      resolveLock();
    };
  }

  async runCheckoutTransaction(params: {
    cartId: string;
    couponId?: string;
    customerId?: string;
    customerEmail?: string;
    items: any[];
    simulateInventoryError?: boolean;
    now?: Date;
  }) {
    const { cartId, couponId, customerId, customerEmail, items, simulateInventoryError, now = new Date() } = params;

    // 1. Guard against empty / already processed cart
    const cartItems = this.carts.get(cartId) || [];
    if (cartItems.length === 0) {
      throw new AppError("Cart is empty or already processed", 400, "EMPTY_CART");
    }

    if (simulateInventoryError) {
      throw new AppError("Insufficient stock", 409, "INSUFFICIENT_STOCK");
    }

    let couponToUpdate: any = null;
    let unlock: (() => void) | null = null;

    if (couponId) {
      unlock = await this.acquireLock(couponId);
      const coupon = this.coupons.get(couponId);

      if (!coupon || !coupon.isActive || coupon.deletedAt) {
        unlock();
        throw new AppError("Coupon is no longer available", 400, "COUPON_UNAVAILABLE");
      }

      if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) {
        unlock();
        throw new AppError("Coupon code is expired or not yet valid", 400, "EXPIRED_COUPON");
      }

      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        unlock();
        throw new AppError("Coupon usage limit exceeded", 400, "COUPON_LIMIT_REACHED");
      }

      // Check per-customer and guest email order count
      const targetEmail = (customerEmail || "").trim().toLowerCase();
      if (coupon.usagePerCustomer !== null) {
        const matchingOrdersCount = this.orders.filter((o) => {
          if (o.couponId !== coupon.id || o.status === "Cancelled") return false;
          const matchesCustomer = customerId && o.customerId === customerId;
          const matchesEmail = targetEmail && o.customerEmail && o.customerEmail.toLowerCase() === targetEmail;
          return matchesCustomer || matchesEmail;
        }).length;

        if (matchingOrdersCount >= coupon.usagePerCustomer) {
          unlock();
          throw new AppError("You have reached the maximum usage limit for this coupon", 400, "CUSTOMER_LIMIT_REACHED");
        }
      }

      couponToUpdate = coupon;
    }

    try {
      // Create Order
      const newOrder = {
        id: `ord-${Math.random().toString(36).substr(2, 9)}`,
        customerId: customerId || null,
        customerEmail: customerEmail || null,
        couponId: couponId || null,
        status: "Pending",
        totalAmount: 100,
        createdAt: new Date(),
      };
      this.orders.push(newOrder);

      // Increment coupon usedCount
      if (couponToUpdate) {
        couponToUpdate.usedCount += 1;
      }

      // Clear cart items
      this.carts.set(cartId, []);

      return newOrder;
    } finally {
      if (unlock) unlock();
    }
  }

  cancelOrder(orderId: string) {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new AppError("Order not found", 404, "NOT_FOUND");
    if (order.status === "Cancelled") return;

    order.status = "Cancelled";
    if (order.couponId) {
      const coupon = this.coupons.get(order.couponId);
      if (coupon && coupon.usedCount > 0) {
        coupon.usedCount -= 1;
      }
    }
  }

  deleteCoupon(couponId: string) {
    const coupon = this.coupons.get(couponId);
    if (!coupon || coupon.deletedAt) throw new AppError("Coupon not found", 404, "NOT_FOUND");
    coupon.deletedAt = new Date();
    coupon.code = `${coupon.code}_DELETED_${coupon.id}`;
  }

  createCoupon(data: any) {
    const normalizedCode = data.code.trim().toUpperCase();
    const activeWithCode = Array.from(this.coupons.values()).find(
      (c) => c.code.toUpperCase() === normalizedCode && !c.deletedAt
    );
    if (activeWithCode) {
      throw new AppError("Coupon code already exists", 400, "DUPLICATE_CODE");
    }
    const id = data.id || `c-${Math.random().toString(36).substr(2, 9)}`;
    const newCoupon = {
      id,
      code: normalizedCode,
      discountType: data.discountType || "percentage",
      discountValue: data.discountValue || 10,
      validFrom: data.validFrom || new Date("2026-01-01"),
      validUntil: data.validUntil || new Date("2026-12-31"),
      isActive: data.isActive ?? true,
      deletedAt: null,
      usageLimit: data.usageLimit ?? null,
      usagePerCustomer: data.usagePerCustomer ?? null,
      usedCount: data.usedCount || 0,
    };
    this.coupons.set(id, newCoupon);
    return newCoupon;
  }
}

async function runCouponConcurrencyTests() {
  console.log("=================================================");
  console.log("RUNNING COUPON CONCURRENCY & LIFECYCLE TESTS");
  console.log("=================================================\n");

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => Promise<void>) {
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

  // TEST 1: Global usageLimit = 1 Concurrent Requests
  await test("Global usageLimit = 1: Two simultaneous requests allow only 1 winner", async () => {
    const store = new MemoryCouponStore();
    const coupon = store.createCoupon({ code: "LIMITED1", usageLimit: 1 });
    store.carts.set("cart-1", [{ id: "i1", qty: 1 }]);
    store.carts.set("cart-2", [{ id: "i2", qty: 1 }]);

    const results = await Promise.allSettled([
      store.runCheckoutTransaction({ cartId: "cart-1", couponId: coupon.id, customerId: "cust-1", items: [{ id: "i1" }] }),
      store.runCheckoutTransaction({ cartId: "cart-2", couponId: coupon.id, customerId: "cust-2", items: [{ id: "i2" }] }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    assert(fulfilled.length === 1, `Expected 1 successful checkout, got ${fulfilled.length}`);
    assert(rejected.length === 1, `Expected 1 rejected checkout, got ${rejected.length}`);
    assert((rejected[0] as any).reason.code === "COUPON_LIMIT_REACHED", "Rejection should be COUPON_LIMIT_REACHED");
    assert(coupon.usedCount === 1, `Expected usedCount to be 1, got ${coupon.usedCount}`);
  });

  // TEST 2: Same Customer Concurrent Checkout (usagePerCustomer = 1)
  await test("Same Customer Concurrent Checkout: usagePerCustomer = 1 allows only 1 checkout", async () => {
    const store = new MemoryCouponStore();
    const coupon = store.createCoupon({ code: "PERCUST1", usagePerCustomer: 1 });
    store.carts.set("cart-cust1-a", [{ id: "i1", qty: 1 }]);
    store.carts.set("cart-cust1-b", [{ id: "i2", qty: 1 }]);

    const results = await Promise.allSettled([
      store.runCheckoutTransaction({ cartId: "cart-cust1-a", couponId: coupon.id, customerId: "cust-100", items: [{ id: "i1" }] }),
      store.runCheckoutTransaction({ cartId: "cart-cust1-b", couponId: coupon.id, customerId: "cust-100", items: [{ id: "i2" }] }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    assert(fulfilled.length === 1, `Expected 1 fulfilled, got ${fulfilled.length}`);
    assert(rejected.length === 1, `Expected 1 rejected, got ${rejected.length}`);
    assert((rejected[0] as any).reason.code === "CUSTOMER_LIMIT_REACHED", "Rejection code should be CUSTOMER_LIMIT_REACHED");
    assert(coupon.usedCount === 1, `Expected usedCount to be 1, got ${coupon.usedCount}`);
  });

  // TEST 3: Different Customers Concurrent Checkout (usagePerCustomer = 1)
  await test("Different Customers Concurrent Checkout: Both succeed when usagePerCustomer = 1", async () => {
    const store = new MemoryCouponStore();
    const coupon = store.createCoupon({ code: "MULTIUSER", usagePerCustomer: 1 });
    store.carts.set("cart-user-1", [{ id: "i1", qty: 1 }]);
    store.carts.set("cart-user-2", [{ id: "i2", qty: 1 }]);

    const results = await Promise.allSettled([
      store.runCheckoutTransaction({ cartId: "cart-user-1", couponId: coupon.id, customerId: "cust-101", items: [{ id: "i1" }] }),
      store.runCheckoutTransaction({ cartId: "cart-user-2", couponId: coupon.id, customerId: "cust-102", items: [{ id: "i2" }] }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    assert(fulfilled.length === 2, `Expected both checkouts to succeed, got ${fulfilled.length}`);
    assert(coupon.usedCount === 2, `Expected usedCount to be 2, got ${coupon.usedCount}`);
  });

  // TEST 4: Guest Checkout with same email (usagePerCustomer = 1)
  await test("Guest Checkout: Blocks concurrent guest checkouts using same email", async () => {
    const store = new MemoryCouponStore();
    const coupon = store.createCoupon({ code: "GUESTDISC", usagePerCustomer: 1 });
    store.carts.set("cart-guest-1", [{ id: "i1", qty: 1 }]);
    store.carts.set("cart-guest-2", [{ id: "i2", qty: 1 }]);

    const results = await Promise.allSettled([
      store.runCheckoutTransaction({ cartId: "cart-guest-1", couponId: coupon.id, customerEmail: "guest@domain.com", items: [{ id: "i1" }] }),
      store.runCheckoutTransaction({ cartId: "cart-guest-2", couponId: coupon.id, customerEmail: "GUEST@DOMAIN.COM", items: [{ id: "i2" }] }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    assert(fulfilled.length === 1, `Expected 1 fulfilled, got ${fulfilled.length}`);
    assert(rejected.length === 1, `Expected 1 rejected, got ${rejected.length}`);
    assert((rejected[0] as any).reason.code === "CUSTOMER_LIMIT_REACHED", "Rejection code should be CUSTOMER_LIMIT_REACHED");
    assert(coupon.usedCount === 1, `Expected usedCount = 1, got ${coupon.usedCount}`);
  });

  // TEST 5: Coupon Expires During Checkout
  await test("Expiration during checkout: Fails with EXPIRED_COUPON", async () => {
    const store = new MemoryCouponStore();
    const coupon = store.createCoupon({
      code: "FLASHEXPIRE",
      validFrom: new Date("2026-01-01"),
      validUntil: new Date("2026-08-01"), // Expired date
    });
    store.carts.set("cart-exp", [{ id: "i1", qty: 1 }]);

    let thrownErr: any = null;
    try {
      await store.runCheckoutTransaction({
        cartId: "cart-exp",
        couponId: coupon.id,
        customerId: "cust-exp",
        items: [{ id: "i1" }],
        now: new Date("2026-08-21T12:00:00Z"),
      });
    } catch (err) {
      thrownErr = err;
    }

    assert(thrownErr !== null, "Should throw an error");
    assert(thrownErr.code === "EXPIRED_COUPON", `Expected EXPIRED_COUPON, got ${thrownErr.code}`);
    assert(coupon.usedCount === 0, "usedCount should remain 0");
  });

  // TEST 6: Failed Checkout (Inventory Failure)
  await test("Failed Checkout: Aborts without consuming coupon usage", async () => {
    const store = new MemoryCouponStore();
    const coupon = store.createCoupon({ code: "FAILTEST", usageLimit: 5 });
    store.carts.set("cart-fail", [{ id: "i1", qty: 1 }]);

    let thrownErr: any = null;
    try {
      await store.runCheckoutTransaction({
        cartId: "cart-fail",
        couponId: coupon.id,
        customerId: "cust-fail",
        items: [{ id: "i1" }],
        simulateInventoryError: true,
      });
    } catch (err) {
      thrownErr = err;
    }

    assert(thrownErr !== null && thrownErr.code === "INSUFFICIENT_STOCK", "Should throw stock error");
    assert(coupon.usedCount === 0, `usedCount should be 0, got ${coupon.usedCount}`);
    assert(store.orders.length === 0, "No order should be created");
  });

  // TEST 7: Cancelled Order Restores Coupon Usage & Allows Re-use
  await test("Cancelled Order: Decrements usedCount and allows customer re-use", async () => {
    const store = new MemoryCouponStore();
    const coupon = store.createCoupon({ code: "REUSE1", usagePerCustomer: 1 });
    store.carts.set("cart-order-1", [{ id: "i1", qty: 1 }]);

    // Order 1
    const order1 = await store.runCheckoutTransaction({
      cartId: "cart-order-1",
      couponId: coupon.id,
      customerId: "cust-reuse",
      items: [{ id: "i1" }],
    });
    assert(coupon.usedCount === 1, "usedCount should be 1");

    // Cancel Order 1
    store.cancelOrder(order1.id);
    assert(coupon.usedCount === 0, "usedCount should be restored to 0");

    // Order 2 by same customer should now succeed!
    store.carts.set("cart-order-2", [{ id: "i2", qty: 1 }]);
    const order2 = await store.runCheckoutTransaction({
      cartId: "cart-order-2",
      couponId: coupon.id,
      customerId: "cust-reuse",
      items: [{ id: "i2" }],
    });
    assert(order2 !== null, "Second order should succeed after cancellation");
    assert(coupon.usedCount === 1, "usedCount should be 1 after second order");
  });

  // TEST 8: Deleted Coupon Code Recreation
  await test("Soft-deleted Coupon Code Recreation: Recreating deleted code succeeds without collision", async () => {
    const store = new MemoryCouponStore();
    const coupon1 = store.createCoupon({ code: "DELETEME" });
    assert(coupon1.code === "DELETEME", "Coupon 1 created");

    // Soft delete
    store.deleteCoupon(coupon1.id);
    assert(coupon1.code.includes("_DELETED_"), "Deleted coupon code renamed");

    // Recreate same code
    const coupon2 = store.createCoupon({ code: "DELETEME" });
    assert(coupon2.code === "DELETEME", "Coupon 2 created with same code name");
    assert(coupon2.id !== coupon1.id, "New coupon has unique ID");
  });

  // TEST 9: Duplicate Checkout Attempts
  await test("Duplicate Checkout Attempts: Second attempt on empty/processed cart fails with EMPTY_CART", async () => {
    const store = new MemoryCouponStore();
    const coupon = store.createCoupon({ code: "DOUBLECLICK" });
    store.carts.set("cart-dup", [{ id: "i1", qty: 1 }]);

    const res1 = await store.runCheckoutTransaction({
      cartId: "cart-dup",
      couponId: coupon.id,
      customerId: "cust-dup",
      items: [{ id: "i1" }],
    });

    let res2Err: any = null;
    try {
      await store.runCheckoutTransaction({
        cartId: "cart-dup",
        couponId: coupon.id,
        customerId: "cust-dup",
        items: [{ id: "i1" }],
      });
    } catch (err) {
      res2Err = err;
    }

    assert(res1 !== null, "First attempt succeeds");
    assert(res2Err !== null && res2Err.code === "EMPTY_CART", "Second attempt fails with EMPTY_CART");
  });

  console.log(`\n=================================================`);
  console.log(`CONCURRENCY RESULTS: ${passed}/${total} Passed`);
  console.log(`=================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runCouponConcurrencyTests();
