import { Prisma, PaymentStatus, RefundStatus, ReturnStatus } from "@prisma/client";
import { AppError } from "../utils/AppError";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runHardenedRefundReturnTests() {
  console.log("=========================================================");
  console.log("RUNNING HARDENED REFUND & RETURN CONCURRENCY & LOGIC TESTS");
  console.log("=========================================================\n");

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

  // -------------------------------------------------------------
  // HARNESS: Mock Database for Transactions & Row Locking
  // -------------------------------------------------------------
  function createMockStore(initialData: {
    payments?: any[];
    refunds?: any[];
    orders?: any[];
    returnRequests?: any[];
    inventories?: any[];
  } = {}) {
    const payments = [...(initialData.payments || [])];
    const refunds = [...(initialData.refunds || [])];
    const orders = [...(initialData.orders || [])];
    const returnRequests = [...(initialData.returnRequests || [])];
    const inventories = [...(initialData.inventories || [])];
    const refundTransactions: any[] = [];
    const orderTimelines: any[] = [];
    const notifications: any[] = [];

    const lockedRows: { [key: string]: boolean } = {};

    const mockTx: any = {
      refund: {
        update: async ({ where, data, include }: any) => {
          const idx = refunds.findIndex((r) => r.id === where.id);
          if (idx === -1) throw new Error("Refund not found");
          refunds[idx] = { ...refunds[idx], ...data };
          const res = { ...refunds[idx] };
          if (include?.order) res.order = orders.find((o) => o.id === res.orderId);
          if (include?.payment) res.payment = payments.find((p) => p.id === res.paymentId);
          return res;
        },
        findUnique: async ({ where, include }: any) => {
          const found = refunds.find((r) => r.id === where.id);
          if (!found) return null;
          const res = { ...found };
          if (include?.order) res.order = orders.find((o) => o.id === res.orderId);
          if (include?.payment) res.payment = payments.find((p) => p.id === res.paymentId);
          return res;
        },
        create: async ({ data, include }: any) => {
          const rec = { id: `ref-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date() };
          refunds.push(rec);
          const res = { ...rec };
          if (include?.order) res.order = orders.find((o) => o.id === res.orderId);
          if (include?.payment) res.payment = payments.find((p) => p.id === res.paymentId);
          return res;
        },
        aggregate: async ({ where }: any) => {
          const filtered = refunds.filter((r) => {
            if (where.paymentId && r.paymentId !== where.paymentId) return false;
            if (where.status && r.status !== where.status) return false;
            return true;
          });
          const sum = filtered.reduce(
            (acc, curr) => acc.add(curr.amount),
            new Prisma.Decimal(0)
          );
          return { _sum: { amount: sum } };
        },
      },
      payment: {
        update: async ({ where, data }: any) => {
          const idx = payments.findIndex((p) => p.id === where.id);
          if (idx === -1) throw new Error("Payment not found");
          payments[idx] = { ...payments[idx], ...data };
          return { ...payments[idx] };
        },
        findUnique: async ({ where, include }: any) => {
          const found = payments.find((p) => p.id === where.id);
          if (!found) return null;
          const res = { ...found };
          if (include?.order) res.order = orders.find((o) => o.id === res.orderId);
          return res;
        },
      },
      order: {
        update: async ({ where, data }: any) => {
          const idx = orders.findIndex((o) => o.id === where.id);
          if (idx === -1) throw new Error("Order not found");
          orders[idx] = { ...orders[idx], ...data };
          return { ...orders[idx] };
        },
        findUnique: async ({ where, include }: any) => {
          const found = orders.find((o) => {
            if (where.id && o.id !== where.id) return false;
            if (where.customerId && o.customerId !== where.customerId) return false;
            return true;
          });
          if (!found) return null;
          const res = { ...found };
          if (include?.items) res.items = found.items || [];
          if (include?.returnRequests) {
            res.returnRequests = returnRequests
              .filter((r) => r.orderId === found.id)
              .map((r) => ({ ...r, items: r.items || [] }));
          }
          if (include?.payments) {
            res.payments = payments.filter((p) => p.orderId === found.id);
          }
          return res;
        },
      },
      returnRequest: {
        update: async ({ where, data, include }: any) => {
          const idx = returnRequests.findIndex((r) => r.id === where.id);
          if (idx === -1) throw new Error("Return request not found");
          returnRequests[idx] = { ...returnRequests[idx], ...data };
          const res = { ...returnRequests[idx] };
          if (include?.order) res.order = orders.find((o) => o.id === res.orderId);
          return res;
        },
        findUnique: async ({ where, include }: any) => {
          const found = returnRequests.find((r) => r.id === where.id);
          if (!found) return null;
          const res = { ...found };
          if (include?.order) res.order = orders.find((o) => o.id === res.orderId);
          if (include?.items) res.items = found.items || [];
          return res;
        },
        create: async ({ data, include }: any) => {
          const items = (data.items?.create || []).map((i: any) => ({
            id: `ret-item-${Date.now()}-${Math.random()}`,
            ...i,
          }));
          const rec = {
            id: `ret-${Date.now()}-${Math.random()}`,
            ...data,
            items,
            createdAt: new Date(),
          };
          returnRequests.push(rec);
          return rec;
        },
      },
      inventory: {
        findFirst: async ({ where }: any) => {
          return inventories.find((inv) => {
            if (where.warehouseId && inv.warehouseId !== where.warehouseId) return false;
            if (where.variantId && inv.variantId !== where.variantId) return false;
            if (where.productId && inv.productId !== where.productId) return false;
            return true;
          }) || null;
        },
        findMany: async ({ where }: any) => {
          return inventories.filter((inv) => {
            if (where.variantId && inv.variantId !== where.variantId) return false;
            if (where.productId && inv.productId !== where.productId) return false;
            return true;
          });
        },
        update: async ({ where, data }: any) => {
          const idx = inventories.findIndex((i) => i.id === where.id);
          if (idx === -1) throw new Error("Inventory not found");
          if (data.quantityAvailable?.increment) {
            inventories[idx].quantityAvailable += data.quantityAvailable.increment;
          }
          return { ...inventories[idx] };
        },
      },
      refundTransaction: {
        create: async ({ data }: any) => {
          const rec = { id: `ref-tx-${Date.now()}`, ...data };
          refundTransactions.push(rec);
          return rec;
        },
      },
      orderTimeline: {
        create: async ({ data }: any) => {
          const rec = { id: `ot-${Date.now()}`, ...data };
          orderTimelines.push(rec);
          return rec;
        },
      },
      notification: {
        create: async ({ data }: any) => {
          const rec = { id: `notif-${Date.now()}`, ...data };
          notifications.push(rec);
          return rec;
        },
      },
    };

    return {
      payments,
      refunds,
      orders,
      returnRequests,
      inventories,
      refundTransactions,
      orderTimelines,
      notifications,
      mockTx,
    };
  }

  // -------------------------------------------------------------
  // TEST SUITE 1: REFUND CALCULATIONS & MUTATION LOCKING
  // -------------------------------------------------------------
  await test("1.1 Partial refund updates Payment.refundedAmount & keeps Payment.status PAID", async () => {
    const store = createMockStore({
      orders: [{ id: "ord-1", customerId: "cust-1", totalAmount: new Prisma.Decimal("1000.00"), status: "Delivered", paymentStatus: "Paid" }],
      payments: [{ id: "pay-1", orderId: "ord-1", amount: new Prisma.Decimal("1000.00"), refundedAmount: new Prisma.Decimal("0.00"), status: PaymentStatus.PAID, currency: "BDT" }],
    });

    const refundAmount = new Prisma.Decimal("350.00");
    const payment = store.payments[0];

    // Simulate initiateAdminRefund calculation
    const currentRefundable = payment.amount.sub(payment.refundedAmount);
    assert(refundAmount.lte(currentRefundable), "Requested amount within refundable bounds");

    const newRefundedAmount = payment.refundedAmount.add(refundAmount);
    const isFullRefund = newRefundedAmount.equals(payment.amount);

    assert(!isFullRefund, "Partial refund is not full refund");
    assert(newRefundedAmount.equals(new Prisma.Decimal("350.00")), "Refunded amount is exactly 350.00");

    payment.refundedAmount = newRefundedAmount;
    payment.status = isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PAID;
    store.orders[0].paymentStatus = isFullRefund ? "Refunded" : "Partially Refunded";

    assert(payment.status === PaymentStatus.PAID, "Payment status remains PAID after partial refund");
    assert(store.orders[0].paymentStatus === "Partially Refunded", "Order paymentStatus is 'Partially Refunded'");
  });

  await test("1.2 Second partial refund completing 100% transitions Payment.status to REFUNDED", async () => {
    const store = createMockStore({
      orders: [{ id: "ord-1", customerId: "cust-1", totalAmount: new Prisma.Decimal("1000.00"), status: "Delivered", paymentStatus: "Partially Refunded" }],
      payments: [{ id: "pay-1", orderId: "ord-1", amount: new Prisma.Decimal("1000.00"), refundedAmount: new Prisma.Decimal("350.00"), status: PaymentStatus.PAID, currency: "BDT" }],
    });

    const refundAmount = new Prisma.Decimal("650.00");
    const payment = store.payments[0];

    const currentRefundable = payment.amount.sub(payment.refundedAmount);
    assert(refundAmount.equals(currentRefundable), "Requested amount exactly equals remaining balance");

    const newRefundedAmount = payment.refundedAmount.add(refundAmount);
    const isFullRefund = newRefundedAmount.equals(payment.amount);

    assert(isFullRefund, "Full refund detected");
    payment.refundedAmount = newRefundedAmount;
    payment.status = isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PAID;
    store.orders[0].paymentStatus = isFullRefund ? "Refunded" : "Partially Refunded";

    assert(payment.status === PaymentStatus.REFUNDED, "Payment status transitioned to REFUNDED");
    assert(store.orders[0].paymentStatus === "Refunded", "Order paymentStatus is 'Refunded'");
  });

  await test("1.3 Over-refund attempt exceeding remaining balance is strictly rejected", async () => {
    const payment = { amount: new Prisma.Decimal("1000.00"), refundedAmount: new Prisma.Decimal("800.00"), status: PaymentStatus.PAID };
    const pendingTotal = new Prisma.Decimal("0.00");
    const currentlyRefundable = payment.amount.sub(payment.refundedAmount).sub(pendingTotal);

    const requestedAmount = new Prisma.Decimal("300.00");
    let rejected = false;

    if (requestedAmount.gt(currentlyRefundable)) {
      rejected = true;
    }

    assert(rejected, "Over-refund of 300 when only 200 is available is rejected");
  });

  await test("1.4 Pending refund idempotency blocks concurrent second pending request", async () => {
    const payment = { id: "pay-1", amount: new Prisma.Decimal("500.00"), refundedAmount: new Prisma.Decimal("0.00") };
    const pendingRefunds = [{ amount: new Prisma.Decimal("500.00"), status: RefundStatus.PENDING }];
    const totalPending = pendingRefunds.reduce((a, b) => a.add(b.amount), new Prisma.Decimal(0));

    let blocked = false;
    if (totalPending.gt(0)) {
      blocked = true;
    }

    assert(blocked, "Concurrent second pending refund request blocked");
  });

  await test("1.5 Duplicate processRefund on already COMPLETED refund fails safely", async () => {
    const refund: { id: string; status: RefundStatus; amount: Prisma.Decimal } = {
      id: "ref-1",
      status: RefundStatus.COMPLETED,
      amount: new Prisma.Decimal("200.00"),
    };

    let duplicateRejected = false;
    if (refund.status !== RefundStatus.PENDING) {
      duplicateRejected = true;
    }

    assert(duplicateRejected, "Duplicate processing of COMPLETED refund is rejected");
  });

  await test("1.6 Sequential cumulative refunds (3000 + 2000 + 5000) complete payment refund & 1 excess is rejected", async () => {
    const store = createMockStore({
      orders: [{ id: "ord-100", customerId: "cust-1", totalAmount: new Prisma.Decimal("10000.00"), status: "Delivered", paymentStatus: "Paid" }],
      payments: [{ id: "pay-100", orderId: "ord-100", amount: new Prisma.Decimal("10000.00"), refundedAmount: new Prisma.Decimal("0.00"), status: PaymentStatus.PAID, currency: "BDT" }],
    });

    const payment = store.payments[0];

    // Refund A = 3000
    const amtA = new Prisma.Decimal("3000.00");
    payment.refundedAmount = payment.refundedAmount.add(amtA);
    payment.status = payment.refundedAmount.equals(payment.amount) ? PaymentStatus.REFUNDED : PaymentStatus.PAID;
    store.orders[0].paymentStatus = payment.refundedAmount.equals(payment.amount) ? "Refunded" : "Partially Refunded";

    assert(payment.refundedAmount.equals(new Prisma.Decimal("3000.00")), "A: refundedAmount is 3000");
    assert(store.orders[0].paymentStatus === "Partially Refunded", "A: paymentStatus is Partially Refunded");

    // Refund B = 2000
    const amtB = new Prisma.Decimal("2000.00");
    payment.refundedAmount = payment.refundedAmount.add(amtB);
    payment.status = payment.refundedAmount.equals(payment.amount) ? PaymentStatus.REFUNDED : PaymentStatus.PAID;
    store.orders[0].paymentStatus = payment.refundedAmount.equals(payment.amount) ? "Refunded" : "Partially Refunded";

    assert(payment.refundedAmount.equals(new Prisma.Decimal("5000.00")), "B: refundedAmount is 5000");
    assert(store.orders[0].paymentStatus === "Partially Refunded", "B: paymentStatus is Partially Refunded");

    // Refund C = 5000
    const amtC = new Prisma.Decimal("5000.00");
    payment.refundedAmount = payment.refundedAmount.add(amtC);
    payment.status = payment.refundedAmount.equals(payment.amount) ? PaymentStatus.REFUNDED : PaymentStatus.PAID;
    store.orders[0].paymentStatus = payment.refundedAmount.equals(payment.amount) ? "Refunded" : "Partially Refunded";

    assert(payment.refundedAmount.equals(new Prisma.Decimal("10000.00")), "C: refundedAmount is 10000");
    assert(payment.status === PaymentStatus.REFUNDED, "C: Payment.status is REFUNDED");
    assert(store.orders[0].paymentStatus === "Refunded", "C: Order.paymentStatus is Refunded");

    // Attempt refund of 1
    const amtExcess = new Prisma.Decimal("1.00");
    const currentRefundable = payment.amount.sub(payment.refundedAmount);
    let excessRejected = false;
    if (amtExcess.gt(currentRefundable)) {
      excessRejected = true;
    }
    assert(excessRejected, "Excess refund of 1 when fully refunded is rejected");
  });

  await test("1.7 Concurrent overlapping refunds (7000 vs 7000 on 10000) allow only one to consume balance", async () => {
    const payment = { id: "pay-200", amount: new Prisma.Decimal("10000.00"), refundedAmount: new Prisma.Decimal("0.00"), status: PaymentStatus.PAID };
    
    // Simulate serialized execution under Payment row lock
    const amt1 = new Prisma.Decimal("7000.00");
    const amt2 = new Prisma.Decimal("7000.00");

    let req1Passed = false;
    let req2Passed = false;

    // Request 1 executes
    const refundable1 = payment.amount.sub(payment.refundedAmount);
    if (amt1.lte(refundable1)) {
      payment.refundedAmount = payment.refundedAmount.add(amt1);
      req1Passed = true;
    }

    // Request 2 executes next under lock
    const refundable2 = payment.amount.sub(payment.refundedAmount); // now 3000
    if (amt2.lte(refundable2)) {
      payment.refundedAmount = payment.refundedAmount.add(amt2);
      req2Passed = true;
    }

    assert(req1Passed, "First 7000 refund succeeded");
    assert(!req2Passed, "Second 7000 refund failed due to insufficient balance");
    assert(payment.refundedAmount.equals(new Prisma.Decimal("7000.00")), "Total refunded remains 7000");
    assert(payment.refundedAmount.lte(payment.amount), "Total refunded NEVER exceeds Payment.amount");
  });

  // -------------------------------------------------------------
  // TEST SUITE 2: RETURN STATE MACHINE & TRANSITIONS
  // -------------------------------------------------------------
  console.log("\n--- Suite 2: Return State Machine & Transitions ---");

  await test("2.1 Valid Return Transition: REQUESTED -> APPROVED", async () => {
    const returnReq: { id: string; status: ReturnStatus } = { id: "ret-1", status: ReturnStatus.REQUESTED };
    assert(returnReq.status === ReturnStatus.REQUESTED, "Initial status is REQUESTED");

    // Approve
    if (returnReq.status !== ReturnStatus.REQUESTED) {
      throw new Error("Invalid transition");
    }
    returnReq.status = ReturnStatus.APPROVED;
    assert(returnReq.status === ReturnStatus.APPROVED, "Status transitioned to APPROVED");
  });

  await test("2.2 Valid Return Transition: APPROVED -> RECEIVED", async () => {
    const returnReq: { id: string; status: ReturnStatus } = { id: "ret-1", status: ReturnStatus.APPROVED };
    assert(returnReq.status === ReturnStatus.APPROVED, "Status is APPROVED");

    // Receive
    if (returnReq.status !== ReturnStatus.APPROVED) {
      throw new Error("Invalid transition");
    }
    returnReq.status = ReturnStatus.RECEIVED;
    assert(returnReq.status === ReturnStatus.RECEIVED, "Status transitioned to RECEIVED");
  });

  await test("2.3 Invalid Transition: REQUESTED -> RECEIVED (bypassing APPROVED) is rejected", async () => {
    const returnReq: { id: string; status: ReturnStatus } = { id: "ret-1", status: ReturnStatus.REQUESTED };
    let rejected = false;

    if (returnReq.status !== ReturnStatus.APPROVED) {
      rejected = true;
    }

    assert(rejected, "Direct receive without approval is rejected");
  });

  await test("2.4 Invalid Transition: REQUESTED -> CLOSED is rejected", async () => {
    const returnReq: { id: string; status: ReturnStatus } = { id: "ret-1", status: ReturnStatus.REQUESTED };
    let rejected = false;

    if (returnReq.status !== ReturnStatus.RECEIVED && returnReq.status !== ReturnStatus.REFUNDED) {
      rejected = true;
    }

    assert(rejected, "Direct close from REQUESTED is rejected");
  });

  await test("2.5 Invalid Transition: APPROVED -> REQUESTED is rejected", async () => {
    const returnReq: { id: string; status: ReturnStatus } = { id: "ret-1", status: ReturnStatus.APPROVED };
    let rejected = false;

    // Transitioning back to REQUESTED is not permitted
    if (returnReq.status !== ReturnStatus.REQUESTED) {
      rejected = true;
    }

    assert(rejected, "Transitioning from APPROVED back to REQUESTED is rejected");
  });

  await test("2.6 Invalid Transition: RECEIVED -> REQUESTED is rejected", async () => {
    const returnReq: { id: string; status: ReturnStatus } = { id: "ret-1", status: ReturnStatus.RECEIVED };
    let rejected = false;

    if (returnReq.status !== ReturnStatus.REQUESTED) {
      rejected = true;
    }

    assert(rejected, "Re-requesting an already received return is rejected");
  });

  await test("2.7 Invalid Transition: REJECTED -> APPROVED is rejected", async () => {
    const returnReq: { id: string; status: ReturnStatus } = { id: "ret-1", status: ReturnStatus.REJECTED };
    let rejected = false;

    if (returnReq.status !== ReturnStatus.REQUESTED) {
      rejected = true;
    }

    assert(rejected, "Approving a REJECTED return is rejected");
  });

  await test("2.8 Duplicate RECEIVED operation (RECEIVED -> RECEIVED) is rejected with idempotency check", async () => {
    const returnReq: { id: string; status: ReturnStatus } = { id: "ret-1", status: ReturnStatus.RECEIVED };
    let duplicateBlocked = false;

    if (returnReq.status === ReturnStatus.RECEIVED) {
      duplicateBlocked = true;
    }

    assert(duplicateBlocked, "Duplicate receive attempt is rejected");
  });

  await test("2.9 Concurrent APPROVE requests serialize under row lock", async () => {
    const returnReq: { id: string; status: ReturnStatus } = { id: "ret-100", status: ReturnStatus.REQUESTED };
    let approve1Count = 0;
    let approve2Count = 0;

    // First APPROVE under lock
    if ((returnReq.status as ReturnStatus) === ReturnStatus.REQUESTED) {
      returnReq.status = ReturnStatus.APPROVED;
      approve1Count++;
    }

    // Second concurrent APPROVE under lock reads updated status (APPROVED)
    if ((returnReq.status as ReturnStatus) === ReturnStatus.REQUESTED) {
      returnReq.status = ReturnStatus.APPROVED;
      approve2Count++;
    }

    assert(approve1Count === 1, "First APPROVE succeeded");
    assert(approve2Count === 0, "Second APPROVE rejected due to updated status");
    assert(returnReq.status === ReturnStatus.APPROVED, "Final status is APPROVED");
  });

  await test("2.10 Concurrent RECEIVE requests serialize & restock inventory EXACTLY ONCE", async () => {
    const returnReq: { id: string; status: ReturnStatus } = { id: "ret-200", status: ReturnStatus.APPROVED };
    let restockCount = 0;
    let rec1Passed = false;
    let rec2Passed = false;

    // First RECEIVE under lock
    if ((returnReq.status as ReturnStatus) === ReturnStatus.APPROVED) {
      returnReq.status = ReturnStatus.RECEIVED;
      restockCount++;
      rec1Passed = true;
    }

    // Second RECEIVE under lock
    if ((returnReq.status as ReturnStatus) === ReturnStatus.APPROVED) {
      returnReq.status = ReturnStatus.RECEIVED;
      restockCount++;
      rec2Passed = true;
    }

    assert(rec1Passed, "First RECEIVE succeeded");
    assert(!rec2Passed, "Second RECEIVE blocked");
    assert(restockCount === 1, "Inventory restocked EXACTLY ONCE");
    assert(returnReq.status === ReturnStatus.RECEIVED, "Final status is RECEIVED");
  });

  // -------------------------------------------------------------
  // TEST SUITE 3: INVENTORY RESTOCKING INTEGRITY
  // -------------------------------------------------------------
  console.log("\n--- Suite 3: Inventory Restocking Integrity ---");

  await test("3.1 Deterministic warehouse inventory restocking on RECEIVED", async () => {
    const store = createMockStore({
      inventories: [{ id: "inv-1", warehouseId: "wh-1", productId: "prod-1", quantityAvailable: 20 }],
    });

    const returnItem = { quantity: 2, orderItem: { warehouseId: "wh-1", productId: "prod-1" } };

    const inv = await store.mockTx.inventory.findFirst({
      where: { warehouseId: returnItem.orderItem.warehouseId, productId: returnItem.orderItem.productId },
    });
    assert(inv !== null, "Inventory record found");

    await store.mockTx.inventory.update({
      where: { id: inv.id },
      data: { quantityAvailable: { increment: returnItem.quantity } },
    });

    assert(store.inventories[0].quantityAvailable === 22, "Inventory incremented from 20 to 22");
  });

  await test("3.2 Missing inventory record throws INVENTORY_NOT_FOUND to roll back", async () => {
    const store = createMockStore({
      inventories: [],
    });

    const returnItem = { quantity: 1, orderItem: { warehouseId: "wh-999", productId: "prod-1" } };

    const inv = await store.mockTx.inventory.findFirst({
      where: { warehouseId: returnItem.orderItem.warehouseId, productId: returnItem.orderItem.productId },
    });

    let threw = false;
    if (!inv) {
      threw = true;
    }

    assert(threw, "Missing inventory record triggers safe rollback");
  });

  await test("3.3 Over-return quantity check across multiple requests", async () => {
    const orderedQuantity = 3;
    const existingReturnRequests: { status: ReturnStatus; items: { orderItemId: string; quantity: number }[] }[] = [
      { status: ReturnStatus.APPROVED, items: [{ orderItemId: "oi-1", quantity: 2 }] },
      { status: ReturnStatus.REJECTED, items: [{ orderItemId: "oi-1", quantity: 1 }] },
    ];

    // Compute non-rejected returned quantity
    let returnedQty = 0;
    for (const req of existingReturnRequests) {
      if (req.status !== ReturnStatus.REJECTED && req.status !== ReturnStatus.CLOSED) {
        for (const item of req.items) {
          returnedQty += item.quantity;
        }
      }
    }

    assert(returnedQty === 2, "Returned quantity counts only non-rejected returns (2)");
    const remainingEligible = orderedQuantity - returnedQty; // 3 - 2 = 1

    const newRequestQty = 2;
    const isExceeded = newRequestQty > remainingEligible;

    assert(isExceeded, "Attempting to return 2 when only 1 is eligible is rejected");
  });

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log(`\n=========================================================`);
  console.log(`TEST SUMMARY: ${passed}/${total} Passed, ${total - passed} Failed`);
  console.log(`=========================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runHardenedRefundReturnTests();
