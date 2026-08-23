import assert from "assert";
import { Prisma, PaymentStatus, RefundStatus } from "@prisma/client";

// Stateful mock store for testing Order Cancellation -> Payment -> Refund Financial Lifecycle
class MockFinancialStore {
  orders: any[] = [];
  payments: any[] = [];
  refunds: any[] = [];
  refundTransactions: any[] = [];
  paymentTransactions: any[] = [];
  inventories: any[] = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.orders = [
      {
        id: "ord-A",
        customerId: "cust-1",
        status: "Pending",
        paymentStatus: "Pending",
        totalAmount: new Prisma.Decimal("100.00"),
        updatedAt: new Date(),
        items: [{ id: "item-1", productId: "prod-1", warehouseId: "wh-1", quantity: 1 }],
      },
      {
        id: "ord-B",
        customerId: "cust-1",
        status: "Processing",
        paymentStatus: "Paid",
        totalAmount: new Prisma.Decimal("100.00"),
        updatedAt: new Date(),
        items: [{ id: "item-2", productId: "prod-1", warehouseId: "wh-1", quantity: 1 }],
      },
      {
        id: "ord-C",
        customerId: "cust-1",
        status: "Processing",
        paymentStatus: "Partially Refunded",
        totalAmount: new Prisma.Decimal("100.00"),
        updatedAt: new Date(),
        items: [{ id: "item-3", productId: "prod-1", warehouseId: "wh-1", quantity: 1 }],
      },
      {
        id: "ord-D",
        customerId: "cust-1",
        status: "Processing",
        paymentStatus: "Refunded",
        totalAmount: new Prisma.Decimal("100.00"),
        updatedAt: new Date(),
        items: [{ id: "item-4", productId: "prod-1", warehouseId: "wh-1", quantity: 1 }],
      },
      {
        id: "ord-E",
        customerId: "cust-1",
        status: "Processing",
        paymentStatus: "Paid",
        totalAmount: new Prisma.Decimal("100.00"),
        updatedAt: new Date(),
        items: [{ id: "item-5", productId: "prod-1", warehouseId: "wh-1", quantity: 1 }],
      },
      {
        id: "ord-G",
        customerId: "cust-1",
        status: "Cancelled",
        paymentStatus: "Pending",
        totalAmount: new Prisma.Decimal("100.00"),
        updatedAt: new Date(),
        items: [{ id: "item-7", productId: "prod-1", warehouseId: "wh-1", quantity: 1 }],
      },
    ];

    this.payments = [
      {
        id: "pay-A",
        orderId: "ord-A",
        customerId: "cust-1",
        amount: new Prisma.Decimal("100.00"),
        refundedAmount: new Prisma.Decimal("0.00"),
        currency: "USD",
        status: PaymentStatus.PENDING,
      },
      {
        id: "pay-B",
        orderId: "ord-B",
        customerId: "cust-1",
        amount: new Prisma.Decimal("100.00"),
        refundedAmount: new Prisma.Decimal("0.00"),
        currency: "USD",
        status: PaymentStatus.PAID,
      },
      {
        id: "pay-C",
        orderId: "ord-C",
        customerId: "cust-1",
        amount: new Prisma.Decimal("100.00"),
        refundedAmount: new Prisma.Decimal("40.00"),
        currency: "USD",
        status: PaymentStatus.PAID,
      },
      {
        id: "pay-D",
        orderId: "ord-D",
        customerId: "cust-1",
        amount: new Prisma.Decimal("100.00"),
        refundedAmount: new Prisma.Decimal("100.00"),
        currency: "USD",
        status: PaymentStatus.REFUNDED,
      },
      {
        id: "pay-E",
        orderId: "ord-E",
        customerId: "cust-1",
        amount: new Prisma.Decimal("100.00"),
        refundedAmount: new Prisma.Decimal("0.00"),
        currency: "USD",
        status: PaymentStatus.PAID,
      },
      {
        id: "pay-G",
        orderId: "ord-G",
        customerId: "cust-1",
        amount: new Prisma.Decimal("100.00"),
        refundedAmount: new Prisma.Decimal("0.00"),
        currency: "USD",
        status: PaymentStatus.PENDING,
      },
    ];

    this.refunds = [
      {
        id: "ref-E-1",
        paymentId: "pay-E",
        orderId: "ord-E",
        customerId: "cust-1",
        amount: new Prisma.Decimal("100.00"),
        currency: "USD",
        status: RefundStatus.PENDING,
        reason: "Customer pre-cancellation request",
      },
    ];

    this.refundTransactions = [];
    this.paymentTransactions = [];
    this.inventories = [
      { id: "inv-1", warehouseId: "wh-1", productId: "prod-1", quantityAvailable: 50 },
    ];
  }

  async cancelOrder(orderId: string) {
    // 1. Lock Order
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    order.updatedAt = new Date();

    // Re-verify under lock
    if (order.status === "Cancelled") {
      return { order, mutated: false };
    }

    const lower = order.status.toLowerCase();
    if (lower === "shipped" || lower === "delivered") {
      throw new Error(`Cannot cancel an order that is already ${order.status}`);
    }

    // Mutate Order status
    order.status = "Cancelled";

    // Process financial lifecycle
    const payments = this.payments.filter((p) => p.orderId === orderId);
    if (payments.length > 0) {
      for (const payment of payments) {
        if (payment.status === PaymentStatus.PENDING || payment.status === PaymentStatus.PROCESSING) {
          payment.status = PaymentStatus.CANCELLED;
          order.paymentStatus = "Cancelled";
          this.paymentTransactions.push({
            id: `ptx-${Date.now()}`,
            paymentId: payment.id,
            status: PaymentStatus.CANCELLED,
          });
        } else if (payment.status === PaymentStatus.PAID) {
          const existingRefunds = this.refunds.filter((r) => r.paymentId === payment.id);
          const totalPending = existingRefunds
            .filter((r) => r.status === RefundStatus.PENDING)
            .reduce((sum, r) => sum.add(r.amount), new Prisma.Decimal(0));

          const remainingRefundable = payment.amount
            .sub(payment.refundedAmount)
            .sub(totalPending);

          if (remainingRefundable.gt(0)) {
            const ref = {
              id: `ref-${Date.now()}-${Math.random()}`,
              paymentId: payment.id,
              orderId: order.id,
              customerId: order.customerId,
              amount: remainingRefundable,
              currency: payment.currency,
              status: RefundStatus.PENDING,
              reason: "Order cancellation auto-refund request",
            };
            this.refunds.push(ref);
            this.refundTransactions.push({
              id: `rtx-${Date.now()}`,
              refundId: ref.id,
              status: RefundStatus.PENDING,
            });
          }
        }
      }
    } else {
      order.paymentStatus = "Cancelled";
    }

    return { order, mutated: true };
  }

  async processRefund(refundId: string, approve: boolean) {
    const refund = this.refunds.find((r) => r.id === refundId);
    if (!refund) throw new Error("REFUND_NOT_FOUND");
    if (refund.status !== RefundStatus.PENDING) throw new Error("INVALID_STATUS");

    const payment = this.payments.find((p) => p.id === refund.paymentId);
    if (!payment) throw new Error("PAYMENT_NOT_FOUND");

    const order = this.orders.find((o) => o.id === refund.orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");

    if (!approve) {
      refund.status = RefundStatus.REJECTED;
      return { refund, payment, order };
    }

    const currentRefundable = payment.amount.sub(payment.refundedAmount);
    if (refund.amount.gt(currentRefundable)) {
      throw new Error("EXCEEDS_REFUNDABLE_AMOUNT");
    }

    const newRefundedAmount = payment.refundedAmount.add(refund.amount);
    const isFullRefund = newRefundedAmount.equals(payment.amount);

    refund.status = RefundStatus.COMPLETED;
    payment.refundedAmount = newRefundedAmount;
    payment.status = isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PAID;
    order.paymentStatus = isFullRefund ? "Refunded" : "Partially Refunded";

    return { refund, payment, order };
  }

  async processLatePaymentWebhook(paymentId: string) {
    const payment = this.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error("PAYMENT_NOT_FOUND");

    payment.status = PaymentStatus.PAID;

    const order = this.orders.find((o) => o.id === payment.orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");

    order.updatedAt = new Date();
    const isCancelled = order.status === "Cancelled";
    const nextOrderStatus = isCancelled ? "Cancelled" : "Processing";

    order.status = nextOrderStatus;
    order.paymentStatus = "Paid";

    if (isCancelled) {
      const existingRefunds = this.refunds.filter((r) => r.paymentId === payment.id);
      const totalPending = existingRefunds
        .filter((r) => r.status === RefundStatus.PENDING)
        .reduce((sum, r) => sum.add(r.amount), new Prisma.Decimal(0));

      const remainingRefundable = payment.amount
        .sub(payment.refundedAmount)
        .sub(totalPending);

      if (remainingRefundable.gt(0)) {
        const ref = {
          id: `ref-late-${Date.now()}`,
          paymentId: payment.id,
          orderId: order.id,
          customerId: order.customerId,
          amount: remainingRefundable,
          currency: payment.currency,
          status: RefundStatus.PENDING,
          reason: "Late payment received for cancelled order",
        };
        this.refunds.push(ref);
      }
    }

    return { payment, order };
  }
}

async function runFinancialLifecycleTests() {
  console.log("=========================================================");
  console.log("AUDITING ORDER CANCELLATION ↔ PAYMENT ↔ REFUND LIFECYCLE");
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

  const store = new MockFinancialStore();

  await test("SCENARIO A: Unpaid Order Cancellation", async () => {
    store.reset();
    const { order } = await store.cancelOrder("ord-A");

    assert.strictEqual(order.status, "Cancelled");
    assert.strictEqual(order.paymentStatus, "Cancelled");

    const payment = store.payments.find((p) => p.id === "pay-A");
    assert.strictEqual(payment.status, PaymentStatus.CANCELLED);

    const refunds = store.refunds.filter((r) => r.orderId === "ord-A");
    assert.strictEqual(refunds.length, 0, "No refund created for unpaid order cancellation");
  });

  await test("SCENARIO B: Paid Order Cancellation & Subsequent Refund Processing", async () => {
    store.reset();
    const { order } = await store.cancelOrder("ord-B");

    assert.strictEqual(order.status, "Cancelled");

    const payment = store.payments.find((p) => p.id === "pay-B");
    assert.strictEqual(payment.status, PaymentStatus.PAID, "Payment remains PAID while refund is PENDING");

    const refunds = store.refunds.filter((r) => r.orderId === "ord-B");
    assert.strictEqual(refunds.length, 1, "Exactly one pending refund created on cancel");
    assert.strictEqual(refunds[0].status, RefundStatus.PENDING);
    assert(refunds[0].amount.equals(new Prisma.Decimal("100.00")));

    // Now process the pending refund
    const refundResult = await store.processRefund(refunds[0].id, true);
    assert.strictEqual(refundResult.refund.status, RefundStatus.COMPLETED);
    assert.strictEqual(refundResult.payment.status, PaymentStatus.REFUNDED);
    assert(refundResult.payment.refundedAmount.equals(new Prisma.Decimal("100.00")));
    assert.strictEqual(refundResult.order.paymentStatus, "Refunded");
  });

  await test("SCENARIO C: Partially Refunded Order Cancellation", async () => {
    store.reset();
    const { order } = await store.cancelOrder("ord-C");

    assert.strictEqual(order.status, "Cancelled");

    const refunds = store.refunds.filter((r) => r.orderId === "ord-C");
    assert.strictEqual(refunds.length, 1, "One new pending refund created for remaining balance");
    assert(refunds[0].amount.equals(new Prisma.Decimal("60.00")), "Refund amount matches remaining balance (100 - 40 = 60)");
  });

  await test("SCENARIO D: Fully Refunded Order Cancellation", async () => {
    store.reset();
    const initialRefundCount = store.refunds.length;
    const { order } = await store.cancelOrder("ord-D");

    assert.strictEqual(order.status, "Cancelled");

    const refundsForD = store.refunds.filter((r) => r.orderId === "ord-D");
    assert.strictEqual(refundsForD.length, 0, "No new refund created for fully refunded order");
    assert.strictEqual(store.refunds.length, initialRefundCount);
  });

  await test("SCENARIO E: Refund Already Pending Cancellation", async () => {
    store.reset();
    const initialRefundCountForE = store.refunds.filter((r) => r.orderId === "ord-E").length;
    assert.strictEqual(initialRefundCountForE, 1, "Starts with 1 pending refund");

    const { order } = await store.cancelOrder("ord-E");

    assert.strictEqual(order.status, "Cancelled");

    const refundsForE = store.refunds.filter((r) => r.orderId === "ord-E");
    assert.strictEqual(refundsForE.length, 1, "No duplicate refund created when one is already pending");
  });

  await test("SCENARIO F: Concurrent Cancellation Requests", async () => {
    store.reset();
    const res1 = await store.cancelOrder("ord-B");
    const res2 = await store.cancelOrder("ord-B");

    assert.strictEqual(res1.mutated, true, "First cancellation mutates state");
    assert.strictEqual(res2.mutated, false, "Second cancellation is idempotent");

    const refundsForB = store.refunds.filter((r) => r.orderId === "ord-B");
    assert.strictEqual(refundsForB.length, 1, "Only one refund created despite dual cancel calls");
  });

  await test("SCENARIO G: Cancellation Races with Late Payment Webhook", async () => {
    store.reset();
    // ord-G is already Cancelled and pay-G is PENDING
    assert.strictEqual(store.orders.find((o) => o.id === "ord-G").status, "Cancelled");

    const webhookRes = await store.processLatePaymentWebhook("pay-G");

    assert.strictEqual(webhookRes.order.status, "Cancelled", "Late payment webhook MUST NOT resurrect cancelled order");
    assert.strictEqual(webhookRes.payment.status, PaymentStatus.PAID);

    const refundsForG = store.refunds.filter((r) => r.orderId === "ord-G");
    assert.strictEqual(refundsForG.length, 1, "Auto-refund created for late payment on cancelled order");
    assert.strictEqual(refundsForG[0].status, RefundStatus.PENDING);
    assert(refundsForG[0].amount.equals(new Prisma.Decimal("100.00")));
  });

  console.log("\n=========================================================");
  console.log(`TEST SUMMARY: ${passed}/${passed + failed} Passed, ${failed} Failed`);
  console.log("=========================================================");

  if (failed > 0) process.exit(1);
}

runFinancialLifecycleTests();
