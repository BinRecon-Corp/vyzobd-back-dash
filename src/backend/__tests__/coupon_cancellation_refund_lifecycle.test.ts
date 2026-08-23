import assert from "assert";
import { Prisma, PaymentStatus, RefundStatus } from "@prisma/client";

// Simulation store for Coupon Lifecycle ↔ Order Cancellation ↔ Refund / Partial Refund
class CouponLifecycleStore {
  coupons = new Map<string, any>();
  orders = new Map<string, any>();
  payments = new Map<string, any>();
  refunds = new Map<string, any>();
  locks = new Map<string, Promise<void>>();

  constructor() {
    this.reset();
  }

  reset() {
    this.coupons.clear();
    this.orders.clear();
    this.payments.clear();
    this.refunds.clear();
    this.locks.clear();

    // Initial state: Coupon usage = 10
    this.coupons.set("coupon-100", {
      id: "coupon-100",
      code: "SAVE20",
      usedCount: 10,
      usageLimit: 50,
      usagePerCustomer: 1,
      isActive: true,
      deletedAt: null,
    });
  }

  async acquireLock(key: string) {
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }
    let resolveLock!: () => void;
    const lockPromise = new Promise<void>((res) => { resolveLock = res; });
    this.locks.set(key, lockPromise);
    return () => {
      this.locks.delete(key);
      resolveLock();
    };
  }

  // 1. Checkout: Create order and apply coupon (Increments usedCount by 1)
  async checkoutWithCoupon(orderId: string, couponId: string, customerId: string, totalAmount: Prisma.Decimal) {
    const unlockCoupon = await this.acquireLock(`coupon-${couponId}`);
    try {
      const coupon = this.coupons.get(couponId);
      if (!coupon) throw new Error("COUPON_NOT_FOUND");

      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        throw new Error("COUPON_LIMIT_REACHED");
      }

      // Increment usage count exactly once
      coupon.usedCount += 1;

      const order = {
        id: orderId,
        customerId,
        couponId: coupon.id,
        status: "Processing",
        paymentStatus: "Paid",
        totalAmount,
        updatedAt: new Date(),
      };
      this.orders.set(orderId, order);

      const payment = {
        id: `pay-${orderId}`,
        orderId,
        customerId,
        amount: totalAmount,
        refundedAmount: new Prisma.Decimal("0.00"),
        status: PaymentStatus.PAID,
      };
      this.payments.set(payment.id, payment);

      return { order, coupon };
    } finally {
      unlockCoupon();
    }
  }

  // 2. Cancellation: Cancel order and decrement coupon usage count
  async cancelOrder(orderId: string) {
    const unlockOrder = await this.acquireLock(`order-${orderId}`);
    try {
      const order = this.orders.get(orderId);
      if (!order) throw new Error("ORDER_NOT_FOUND");

      // Idempotency check under row lock
      if (order.status === "Cancelled") {
        return { order, mutated: false };
      }

      const lower = order.status.toLowerCase();
      if (lower === "shipped" || lower === "delivered") {
        throw new Error(`Cannot cancel an order that is already ${order.status}`);
      }

      order.status = "Cancelled";
      order.updatedAt = new Date();

      // Financial cancellation / refund staging
      const payment = this.payments.get(`pay-${orderId}`);
      if (payment && payment.status === PaymentStatus.PAID) {
        const remainingRefundable = payment.amount.sub(payment.refundedAmount);
        if (remainingRefundable.gt(0)) {
          const refund = {
            id: `ref-auto-${orderId}`,
            paymentId: payment.id,
            orderId,
            customerId: order.customerId,
            amount: remainingRefundable,
            status: RefundStatus.PENDING,
          };
          this.refunds.set(refund.id, refund);
        }
      }

      // Restore coupon usage count exactly once
      if (order.couponId) {
        const unlockCoupon = await this.acquireLock(`coupon-${order.couponId}`);
        try {
          const coupon = this.coupons.get(order.couponId);
          if (coupon && coupon.usedCount > 0) {
            coupon.usedCount -= 1;
          }
        } finally {
          unlockCoupon();
        }
      }

      return { order, mutated: true };
    } finally {
      unlockOrder();
    }
  }

  // 3. Process Refund (Full or Partial)
  async processRefund(refundId: string, refundAmount: Prisma.Decimal) {
    const refund = this.refunds.get(refundId);
    if (!refund) throw new Error("REFUND_NOT_FOUND");

    const payment = this.payments.get(refund.paymentId);
    if (!payment) throw new Error("PAYMENT_NOT_FOUND");

    const order = this.orders.get(refund.orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");

    const currentRefundable = payment.amount.sub(payment.refundedAmount);
    if (refundAmount.gt(currentRefundable)) {
      throw new Error("EXCEEDS_REFUNDABLE_AMOUNT");
    }

    const newRefundedAmount = payment.refundedAmount.add(refundAmount);
    const isFullRefund = newRefundedAmount.equals(payment.amount);

    payment.refundedAmount = newRefundedAmount;
    payment.status = isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PAID;
    order.paymentStatus = isFullRefund ? "Refunded" : "Partially Refunded";
    refund.status = RefundStatus.COMPLETED;

    // CRITICAL LIFE CYCLE AUDIT REQUIREMENT:
    // Processing a refund MUST NOT touch or decrement coupon.usedCount again!

    return { refund, payment, order };
  }
}

async function runCouponLifecycleAuditTests() {
  console.log("=========================================================");
  console.log("AUDITING COUPON LIFECYCLE ↔ ORDER CANCELLATION ↔ REFUNDS");
  console.log("=========================================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✓ PASSED: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ FAILED: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  const store = new CouponLifecycleStore();

  await test("Scenario 1: Full Sequence (Checkout 10->11 -> Cancel 11->10 -> Duplicate Cancel 10 -> Refund 10)", async () => {
    store.reset();
    const couponId = "coupon-100";
    const orderId = "ord-500";

    // Initial state
    assert.strictEqual(store.coupons.get(couponId).usedCount, 10, "Coupon usage before checkout = 10");

    // Checkout: Order uses coupon
    await store.checkoutWithCoupon(orderId, couponId, "cust-1", new Prisma.Decimal("100.00"));
    assert.strictEqual(store.coupons.get(couponId).usedCount, 11, "Coupon usage after checkout = 11");

    // Cancel order
    const cancelRes1 = await store.cancelOrder(orderId);
    assert.strictEqual(cancelRes1.mutated, true, "First cancellation mutated state");
    assert.strictEqual(store.coupons.get(couponId).usedCount, 10, "Coupon usage after cancel = 10");

    // Second cancellation (Duplicate call)
    const cancelRes2 = await store.cancelOrder(orderId);
    assert.strictEqual(cancelRes2.mutated, false, "Second cancellation is idempotent");
    assert.strictEqual(store.coupons.get(couponId).usedCount, 10, "Coupon usage remains 10 after duplicate cancel");

    // Process auto-refund for the cancelled order
    const refundRes = await store.processRefund(`ref-auto-${orderId}`, new Prisma.Decimal("100.00"));
    assert.strictEqual(refundRes.refund.status, RefundStatus.COMPLETED);
    assert.strictEqual(store.coupons.get(couponId).usedCount, 10, "Coupon usage remains 10 after refund (not decremented again)");
  });

  await test("Scenario 2: Return & Partial Refund without Cancellation (Coupon usage remains unchanged)", async () => {
    store.reset();
    const couponId = "coupon-100";
    const orderId = "ord-600";

    // Checkout
    await store.checkoutWithCoupon(orderId, couponId, "cust-1", new Prisma.Decimal("200.00"));
    assert.strictEqual(store.coupons.get(couponId).usedCount, 11, "Coupon usage after checkout = 11");

    // Simulate Return & Partial Refund ($50.00) without cancelling the order
    const refundObj = {
      id: "ref-partial-600",
      paymentId: `pay-${orderId}`,
      orderId,
      customerId: "cust-1",
      amount: new Prisma.Decimal("50.00"),
      status: RefundStatus.PENDING,
    };
    store.refunds.set(refundObj.id, refundObj);

    await store.processRefund("ref-partial-600", new Prisma.Decimal("50.00"));

    assert.strictEqual(store.orders.get(orderId).paymentStatus, "Partially Refunded");
    assert.strictEqual(store.coupons.get(couponId).usedCount, 11, "Coupon usage remains 11 on partial refund (not modified)");

    // Simulate second Partial Refund ($150.00 completing full refund)
    const refundObj2 = {
      id: "ref-partial-600-2",
      paymentId: `pay-${orderId}`,
      orderId,
      customerId: "cust-1",
      amount: new Prisma.Decimal("150.00"),
      status: RefundStatus.PENDING,
    };
    store.refunds.set(refundObj2.id, refundObj2);

    await store.processRefund("ref-partial-600-2", new Prisma.Decimal("150.00"));

    assert.strictEqual(store.orders.get(orderId).paymentStatus, "Refunded");
    assert.strictEqual(store.coupons.get(couponId).usedCount, 11, "Coupon usage remains 11 on full return refund (not modified)");
  });

  await test("Scenario 3: Concurrent Order Cancellations (Coupon usage remains correct)", async () => {
    store.reset();
    const couponId = "coupon-100";
    const orderId = "ord-700";

    await store.checkoutWithCoupon(orderId, couponId, "cust-1", new Prisma.Decimal("150.00"));
    assert.strictEqual(store.coupons.get(couponId).usedCount, 11);

    // Launch two simultaneous cancellation requests
    const [c1, c2] = await Promise.all([
      store.cancelOrder(orderId),
      store.cancelOrder(orderId),
    ]);

    const mutatedCount = [c1.mutated, c2.mutated].filter(Boolean).length;
    assert.strictEqual(mutatedCount, 1, "Exactly one cancellation request mutated state under row lock");
    assert.strictEqual(store.coupons.get(couponId).usedCount, 10, "Coupon usage decremented exactly once to 10");
  });

  console.log("\n=========================================================");
  console.log(`TEST SUMMARY: ${passed}/${passed + failed} Passed, ${failed} Failed`);
  console.log("=========================================================");

  if (failed > 0) process.exit(1);
}

runCouponLifecycleAuditTests();
