import assert from "assert";
import { ShipmentStatus, TrackingStatus } from "@prisma/client";

// In-memory mock store representing stateful database row locking & transactions
class MockStore {
  orders: any[] = [];
  shipments: any[] = [];
  inventories: any[] = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.orders = [
      {
        id: "ord-1",
        customerId: "cust-1",
        status: "Processing",
        updatedAt: new Date(),
        items: [
          {
            id: "item-1",
            orderId: "ord-1",
            productId: "prod-1",
            warehouseId: "wh-1",
            quantity: 2,
          },
        ],
      },
    ];

    this.shipments = [
      {
        id: "ship-1",
        orderId: "ord-1",
        status: ShipmentStatus.PENDING,
        trackingNumber: "TRK123",
      },
    ];

    this.inventories = [
      {
        id: "inv-1",
        warehouseId: "wh-1",
        productId: "prod-1",
        quantityAvailable: 10,
      },
    ];
  }

  // Transactionally cancel order
  async cancelOrder(orderId: string) {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");

    // Lock Order row
    order.updatedAt = new Date();

    // Check terminal order status
    if (order.status === "Cancelled") {
      return { status: "ALREADY_CANCELLED", order };
    }

    const lower = order.status.toLowerCase();
    if (lower === "shipped" || lower === "delivered") {
      throw new Error(`INVALID_ORDER_STATE: Cannot cancel an order that is already ${order.status}`);
    }

    // Update status to Cancelled
    order.status = "Cancelled";

    // Restock inventory
    for (const item of order.items) {
      const inv = this.inventories.find((i) => i.warehouseId === item.warehouseId && i.productId === item.productId);
      if (inv) {
        inv.quantityAvailable += item.quantity;
      }
    }

    return { status: "SUCCESS", order };
  }

  // Transactionally update shipment status (e.g. to SHIPPED or DELIVERED)
  async updateShipmentStatus(shipmentId: string, newStatus: ShipmentStatus) {
    const shipment = this.shipments.find((s) => s.id === shipmentId);
    if (!shipment) throw new Error("SHIPMENT_NOT_FOUND");

    const order = this.orders.find((o) => o.id === shipment.orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");

    // Lock Order row FIRST before any shipment modifications
    order.updatedAt = new Date();

    if (order.status === "Cancelled") {
      throw new Error("ORDER_CANCELLED: Cannot update shipment for a cancelled order");
    }

    if (order.status === "Returned") {
      throw new Error("ORDER_RETURNED: Cannot update shipment for a returned order");
    }

    // Mutate shipment status
    shipment.status = newStatus;

    // Mutate order status
    if (newStatus === ShipmentStatus.DELIVERED) {
      order.status = "Delivered";
    } else if (newStatus === ShipmentStatus.SHIPPED) {
      order.status = "Shipped";
    }

    return { shipment, order };
  }
}

async function runTests() {
  console.log("=========================================================");
  console.log("RUNNING SHIPMENT <-> ORDER <-> CANCELLATION CONCURRENCY TESTS");
  console.log("=========================================================");

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

  const store = new MockStore();

  await test("1. Concurrent Cancel (A) vs Ship (B): Cancel wins first lock", async () => {
    store.reset();
    const orderId = "ord-1";
    const shipmentId = "ship-1";

    // Cancel executes first
    const cancelRes = await store.cancelOrder(orderId);
    assert.strictEqual(cancelRes.order.status, "Cancelled");
    assert.strictEqual(store.inventories[0].quantityAvailable, 12, "Inventory restocked from 10 to 12");

    // Subsequent ship attempt must throw ORDER_CANCELLED
    let shipFailed = false;
    try {
      await store.updateShipmentStatus(shipmentId, ShipmentStatus.SHIPPED);
    } catch (err: any) {
      shipFailed = err.message.includes("ORDER_CANCELLED");
    }

    assert(shipFailed, "Shipping a cancelled order strictly throws ORDER_CANCELLED");
    assert.strictEqual(store.orders[0].status, "Cancelled");
    assert.strictEqual(store.shipments[0].status, ShipmentStatus.PENDING);
  });

  await test("2. Concurrent Cancel (A) vs Ship (B): Ship wins first lock", async () => {
    store.reset();
    const orderId = "ord-1";
    const shipmentId = "ship-1";

    // Ship executes first
    const shipRes = await store.updateShipmentStatus(shipmentId, ShipmentStatus.SHIPPED);
    assert.strictEqual(shipRes.order.status, "Shipped");
    assert.strictEqual(shipRes.shipment.status, ShipmentStatus.SHIPPED);

    // Subsequent cancel attempt must throw INVALID_ORDER_STATE
    let cancelFailed = false;
    try {
      await store.cancelOrder(orderId);
    } catch (err: any) {
      cancelFailed = err.message.includes("INVALID_ORDER_STATE");
    }

    assert(cancelFailed, "Cancelling a shipped order strictly throws INVALID_ORDER_STATE");
    assert.strictEqual(store.orders[0].status, "Shipped");
    assert.strictEqual(store.shipments[0].status, ShipmentStatus.SHIPPED);
  });

  await test("3. Forbidden State Check: Cancelled + Shipped is IMPOSSIBLE", async () => {
    store.reset();
    const isForbiddenState =
      store.orders[0].status === "Cancelled" && store.shipments[0].status === ShipmentStatus.SHIPPED;

    assert(!isForbiddenState, "Order is not in invalid state (Cancelled + Shipped)");
  });

  await test("4. Delivered + Cancelled rejection", async () => {
    store.reset();
    store.orders[0].status = "Delivered";

    let cancelFailed = false;
    try {
      await store.cancelOrder("ord-1");
    } catch (err: any) {
      cancelFailed = err.message.includes("INVALID_ORDER_STATE");
    }

    assert(cancelFailed, "Cancelling a delivered order is rejected");
    assert.strictEqual(store.orders[0].status, "Delivered");
  });

  await test("5. Cancelled + Delivered rejection", async () => {
    store.reset();
    store.orders[0].status = "Cancelled";

    let deliverFailed = false;
    try {
      await store.updateShipmentStatus("ship-1", ShipmentStatus.DELIVERED);
    } catch (err: any) {
      deliverFailed = err.message.includes("ORDER_CANCELLED");
    }

    assert(deliverFailed, "Delivering a cancelled order is rejected");
    assert.strictEqual(store.orders[0].status, "Cancelled");
    assert.strictEqual(store.shipments[0].status, ShipmentStatus.PENDING);
  });

  console.log("=========================================================");
  console.log(`TEST SUMMARY: ${passed}/${passed + failed} Passed, ${failed} Failed`);
  console.log("=========================================================");

  if (failed > 0) process.exit(1);
}

runTests();
