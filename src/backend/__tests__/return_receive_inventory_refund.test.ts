import assert from "assert";
import { Prisma, PaymentStatus, RefundStatus, ReturnStatus } from "@prisma/client";

// Simulation store testing the full RETURN -> RECEIVE -> INVENTORY RESTOCK -> REFUND lifecycle
class MockLifecycleStore {
  orders: any[] = [];
  returnRequests: any[] = [];
  inventories: any[] = [];
  payments: any[] = [];
  refunds: any[] = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.orders = [
      {
        id: "ord-100",
        customerId: "cust-1",
        status: "Delivered",
        paymentStatus: "Paid",
        totalAmount: new Prisma.Decimal("500.00"),
        updatedAt: new Date(),
        items: [
          {
            id: "item-100",
            orderId: "ord-100",
            productId: "prod-100",
            warehouseId: "wh-1",
            quantity: 5,
            unitPrice: new Prisma.Decimal("100.00"),
          },
        ],
      },
    ];

    this.returnRequests = [];

    this.inventories = [
      {
        id: "inv-wh-1",
        warehouseId: "wh-1",
        productId: "prod-100",
        quantityAvailable: 10,
      },
      {
        id: "inv-wh-2",
        warehouseId: "wh-2",
        productId: "prod-100",
        quantityAvailable: 10,
      },
    ];

    this.payments = [
      {
        id: "pay-100",
        orderId: "ord-100",
        customerId: "cust-1",
        amount: new Prisma.Decimal("500.00"),
        refundedAmount: new Prisma.Decimal("0.00"),
        currency: "USD",
        status: PaymentStatus.PAID,
      },
    ];

    this.refunds = [];
  }

  // 1. Customer requests return
  async requestReturn(
    customerId: string,
    orderId: string,
    items: { orderItemId: string; quantity: number }[],
    reason: string = "Defective item"
  ) {
    const order = this.orders.find((o) => o.id === orderId && o.customerId === customerId);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.status.toLowerCase() !== "delivered") {
      throw new Error(`Only delivered orders can be returned (current: ${order.status})`);
    }

    const orderItemMap = new Map<string, number>(order.items.map((i: any) => [i.id as string, Number(i.quantity)]));
    const orderItemObjMap = new Map<string, any>(order.items.map((i: any) => [i.id as string, i]));
    const returnedMap = new Map<string, number>();

    // Count previously requested/approved/received/refunded/closed returns
    for (const returnReq of this.returnRequests.filter((r) => r.orderId === orderId)) {
      if (returnReq.status !== ReturnStatus.REJECTED) {
        for (const item of returnReq.items) {
          returnedMap.set(item.orderItemId, (returnedMap.get(item.orderItemId) || 0) + item.quantity);
        }
      }
    }

    const returnItemsToCreate: any[] = [];
    for (const item of items) {
      if (item.quantity <= 0) throw new Error("INVALID_QUANTITY");
      const orderedQty = orderItemMap.get(item.orderItemId);
      if (orderedQty === undefined) throw new Error("INVALID_ITEM");

      const prevReturned = returnedMap.get(item.orderItemId) || 0;
      const remainingEligible = Number(orderedQty) - Number(prevReturned);

      if (item.quantity > remainingEligible) {
        throw new Error(`EXCEEDS_ORDERED_QUANTITY: Cannot return ${item.quantity}. Only ${remainingEligible} remaining eligible.`);
      }

      returnedMap.set(item.orderItemId, prevReturned + item.quantity);
      returnItemsToCreate.push({
        id: `ret-item-${Date.now()}-${Math.random()}`,
        orderItemId: item.orderItemId,
        warehouseId: (orderItemObjMap.get(item.orderItemId) as any)?.warehouseId || null,
        quantity: item.quantity,
      });
    }

    const returnReq = {
      id: `ret-req-${Date.now()}-${Math.random()}`,
      orderId,
      customerId,
      reason,
      status: ReturnStatus.REQUESTED,
      items: returnItemsToCreate,
      updatedAt: new Date(),
    };

    this.returnRequests.push(returnReq);
    return returnReq;
  }

  // 2. Admin approves return
  async approveReturn(returnId: string) {
    const returnReq = this.returnRequests.find((r) => r.id === returnId);
    if (!returnReq) throw new Error("RETURN_NOT_FOUND");

    if (returnReq.status !== ReturnStatus.REQUESTED) {
      throw new Error(`Cannot approve return from status ${returnReq.status}. Only REQUESTED can be approved.`);
    }

    returnReq.status = ReturnStatus.APPROVED;
    returnReq.updatedAt = new Date();
    return returnReq;
  }

  // 3. Warehouse receives return (Restocks inventory exactly once)
  async receiveReturn(returnId: string) {
    const returnReq = this.returnRequests.find((r) => r.id === returnId);
    if (!returnReq) throw new Error("RETURN_NOT_FOUND");

    if (returnReq.status === ReturnStatus.RECEIVED) {
      throw new Error("RETURN_ALREADY_RECEIVED: Return request has already been marked as RECEIVED");
    }

    if (returnReq.status !== ReturnStatus.APPROVED) {
      throw new Error(`Cannot receive return from status ${returnReq.status}. Only APPROVED can be marked as RECEIVED.`);
    }

    // Restock inventory preserving warehouse origin
    const order = this.orders.find((o) => o.id === returnReq.orderId);
    for (const item of returnReq.items) {
      const orderItem = order.items.find((i: any) => i.id === item.orderItemId);
      const targetWarehouseId = item.warehouseId || orderItem?.warehouseId;

      if (!targetWarehouseId) throw new Error("INVENTORY_WAREHOUSE_ORIGIN_UNKNOWN");

      const inv = this.inventories.find(
        (i) => i.warehouseId === targetWarehouseId && i.productId === orderItem.productId
      );

      if (!inv) throw new Error("INVENTORY_NOT_FOUND");
      inv.quantityAvailable += item.quantity;
    }

    returnReq.status = ReturnStatus.RECEIVED;
    returnReq.updatedAt = new Date();
    return returnReq;
  }

  // 4. Admin issues refund for return
  async processRefundForReturn(paymentId: string, refundAmount: Prisma.Decimal) {
    const payment = this.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error("PAYMENT_NOT_FOUND");

    const order = this.orders.find((o) => o.id === payment.orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");

    const currentRefundable = payment.amount.sub(payment.refundedAmount);
    if (refundAmount.lte(0)) throw new Error("INVALID_AMOUNT");
    if (refundAmount.gt(currentRefundable)) {
      throw new Error(`EXCEEDS_REFUNDABLE_AMOUNT: Requested ${refundAmount} exceeds available ${currentRefundable}`);
    }

    const newRefundedAmount = payment.refundedAmount.add(refundAmount);
    const isFullRefund = newRefundedAmount.equals(payment.amount);

    payment.refundedAmount = newRefundedAmount;
    payment.status = isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PAID;

    order.paymentStatus = isFullRefund ? "Refunded" : "Partially Refunded";

    const refund = {
      id: `ref-${Date.now()}-${Math.random()}`,
      paymentId: payment.id,
      orderId: order.id,
      amount: refundAmount,
      status: RefundStatus.COMPLETED,
    };
    this.refunds.push(refund);

    return { refund, payment, order };
  }
}

async function runReturnLifecycleAuditTests() {
  console.log("=========================================================");
  console.log("AUDITING COMPLETE RETURN -> RECEIVE -> RESTOCK -> REFUND LIFECYCLE");
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

  const store = new MockLifecycleStore();

  await test("1. Complete Lifecycle (Purchased 5, Return 2, Return 2, Return 2 attempt)", async () => {
    store.reset();
    const orderId = "ord-100";
    const customerId = "cust-1";
    const orderItemId = "item-100";

    const initialWarehouseStock = (store.inventories.find((i: any) => i.warehouseId === "wh-1") as any).quantityAvailable;
    assert.strictEqual(initialWarehouseStock, 10, "Initial warehouse A stock is 10");

    // First Return: 2 units
    const ret1 = await store.requestReturn(customerId, orderId, [{ orderItemId, quantity: 2 }]);
    assert.strictEqual(ret1.status, ReturnStatus.REQUESTED);

    await store.approveReturn(ret1.id);
    assert.strictEqual(ret1.status, ReturnStatus.APPROVED);

    await store.receiveReturn(ret1.id);
    assert.strictEqual(ret1.status, ReturnStatus.RECEIVED);
    const stockAfterRet1 = (store.inventories.find((i: any) => i.warehouseId === "wh-1") as any).quantityAvailable;
    assert.strictEqual(stockAfterRet1, 12, "Stock incremented by +2 (10 -> 12)");

    // Refund for first 2 units ($200.00)
    const refund1 = await store.processRefundForReturn("pay-100", new Prisma.Decimal("200.00"));
    assert.strictEqual(refund1.payment.status, PaymentStatus.PAID);
    assert.strictEqual(refund1.order.paymentStatus, "Partially Refunded");
    assert(refund1.payment.refundedAmount.equals(new Prisma.Decimal("200.00")));

    // Second Return: 2 units
    const ret2 = await store.requestReturn(customerId, orderId, [{ orderItemId, quantity: 2 }]);
    await store.approveReturn(ret2.id);
    await store.receiveReturn(ret2.id);

    const stockAfterRet2 = (store.inventories.find((i: any) => i.warehouseId === "wh-1") as any).quantityAvailable;
    assert.strictEqual(stockAfterRet2, 14, "Stock incremented by +2 again (12 -> 14, total +4, NOT +6)");

    // Refund for second 2 units ($200.00)
    const refund2 = await store.processRefundForReturn("pay-100", new Prisma.Decimal("200.00"));
    assert.strictEqual(refund2.payment.status, PaymentStatus.PAID);
    assert.strictEqual(refund2.order.paymentStatus, "Partially Refunded");
    assert(refund2.payment.refundedAmount.equals(new Prisma.Decimal("400.00")));

    // Third Return Attempt: 2 units (Only 5 - 4 = 1 eligible remaining)
    let thirdAttemptFailed = false;
    try {
      await store.requestReturn(customerId, orderId, [{ orderItemId, quantity: 2 }]);
    } catch (err: any) {
      thirdAttemptFailed = err.message.includes("EXCEEDS_ORDERED_QUANTITY");
    }

    assert(thirdAttemptFailed, "Third return request for 2 units is rejected because only 1 unit remains eligible");

    // Valid Third Return: 1 unit (remaining eligible)
    const ret3 = await store.requestReturn(customerId, orderId, [{ orderItemId, quantity: 1 }]);
    await store.approveReturn(ret3.id);
    await store.receiveReturn(ret3.id);
    const stockAfterRet3 = (store.inventories.find((i: any) => i.warehouseId === "wh-1") as any).quantityAvailable;
    assert.strictEqual(stockAfterRet3, 15, "Final stock incremented by +1 (total +5)");

    // Final Refund completing remaining $100.00
    const refund3 = await store.processRefundForReturn("pay-100", new Prisma.Decimal("100.00"));
    assert.strictEqual(refund3.payment.status, PaymentStatus.REFUNDED);
    assert.strictEqual(refund3.order.paymentStatus, "Refunded");
    assert(refund3.payment.refundedAmount.equals(new Prisma.Decimal("500.00")));
  });

  await test("2. Re-Receive Protection (Inventory restored exactly once)", async () => {
    store.reset();
    const ret = await store.requestReturn("cust-1", "ord-100", [{ orderItemId: "item-100", quantity: 2 }]);
    await store.approveReturn(ret.id);
    await store.receiveReturn(ret.id);

    const stock = (store.inventories.find((i: any) => i.warehouseId === "wh-1") as any).quantityAvailable;
    assert.strictEqual(stock, 12, "Stock restored once to 12");

    let duplicateReceiveFailed = false;
    try {
      await store.receiveReturn(ret.id);
    } catch (err: any) {
      duplicateReceiveFailed = err.message.includes("RETURN_ALREADY_RECEIVED");
    }

    assert(duplicateReceiveFailed, "Duplicate receive attempt is rejected");
    const finalStock = (store.inventories.find((i: any) => i.warehouseId === "wh-1") as any).quantityAvailable;
    assert.strictEqual(finalStock, 12, "Stock remains 12 and is not double-restocked");
  });

  await test("3. Return Status Reversal Prevention", async () => {
    store.reset();
    const ret = await store.requestReturn("cust-1", "ord-100", [{ orderItemId: "item-100", quantity: 2 }]);

    // Attempt to receive directly from REQUESTED (bypassing APPROVED)
    let invalidTransition = false;
    try {
      await store.receiveReturn(ret.id);
    } catch (err: any) {
      invalidTransition = err.message.includes("Only APPROVED can be marked as RECEIVED");
    }
    assert(invalidTransition, "Cannot jump from REQUESTED directly to RECEIVED");
  });

  await test("4. Warehouse Origin Preservation", async () => {
    store.reset();
    // Item originated from wh-1
    const ret = await store.requestReturn("cust-1", "ord-100", [{ orderItemId: "item-100", quantity: 3 }]);
    await store.approveReturn(ret.id);
    await store.receiveReturn(ret.id);

    const stockWh1 = (store.inventories.find((i: any) => i.warehouseId === "wh-1") as any).quantityAvailable;
    const stockWh2 = (store.inventories.find((i: any) => i.warehouseId === "wh-2") as any).quantityAvailable;

    assert.strictEqual(stockWh1, 13, "Stock restored ONLY to fulfilling warehouse wh-1 (10 -> 13)");
    assert.strictEqual(stockWh2, 10, "Warehouse wh-2 stock remains untouched (10)");
  });

  await test("5. Over-Refund Prevention", async () => {
    store.reset();
    let overRefundFailed = false;
    try {
      await store.processRefundForReturn("pay-100", new Prisma.Decimal("600.00"));
    } catch (err: any) {
      overRefundFailed = err.message.includes("EXCEEDS_REFUNDABLE_AMOUNT");
    }

    assert(overRefundFailed, "Refund exceeding payment amount ($600 > $500) is rejected");
  });

  console.log("\n=========================================================");
  console.log(`TEST SUMMARY: ${passed}/${passed + failed} Passed, ${failed} Failed`);
  console.log("=========================================================");

  if (failed > 0) process.exit(1);
}

runReturnLifecycleAuditTests();
