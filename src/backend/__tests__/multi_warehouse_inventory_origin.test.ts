import assert from "assert";
import { AppError } from "../utils/AppError";
import { ReturnStatus, ShipmentStatus } from "@prisma/client";

// ============================================================================
// SIMULATION STORE & TRANSACTION HARNESS FOR MULTI-WAREHOUSE INVENTORY ORIGIN
// ============================================================================

interface Warehouse {
  id: string;
  name: string;
}

interface Inventory {
  id: string;
  warehouseId: string | null;
  productId?: string;
  variantId?: string;
  quantityAvailable: number;
  quantityReserved: number;
}

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productVariantId?: string | null;
  warehouseId: string | null;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  customerId: string;
  couponId?: string | null;
  updatedAt: Date;
}

interface ShipmentItem {
  id: string;
  shipmentId: string;
  orderItemId: string;
  warehouseId: string | null;
  quantity: number;
}

interface Shipment {
  id: string;
  orderId: string;
  status: ShipmentStatus;
  items: ShipmentItem[];
}

interface ReturnItem {
  id: string;
  returnRequestId: string;
  orderItemId: string;
  warehouseId: string | null;
  quantity: number;
}

interface ReturnRequest {
  id: string;
  orderId: string;
  customerId: string;
  status: ReturnStatus;
  reason: string;
  adminNotes?: string | null;
  items: ReturnItem[];
  updatedAt: Date;
}

class MultiWarehouseMockStore {
  warehouses: Warehouse[] = [];
  inventories: Inventory[] = [];
  orders: Order[] = [];
  orderItems: OrderItem[] = [];
  shipments: Shipment[] = [];
  shipmentItems: ShipmentItem[] = [];
  returnRequests: ReturnRequest[] = [];
  returnItems: ReturnItem[] = [];
  
  // Mutex simulation for database transactions & row locking
  private txMutex = Promise.resolve();

  reset() {
    this.warehouses = [
      { id: "wh-A", name: "Warehouse A (East Coast)" },
      { id: "wh-B", name: "Warehouse B (West Coast)" },
    ];
    this.inventories = [];
    this.orders = [];
    this.orderItems = [];
    this.shipments = [];
    this.shipmentItems = [];
    this.returnRequests = [];
    this.returnItems = [];
    this.txMutex = Promise.resolve();
  }

  // Transaction simulation with serialized atomic locking
  async $transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    const prevMutex = this.txMutex;
    let release: () => void;
    this.txMutex = new Promise<void>((resolve) => {
      release = resolve;
    });

    await prevMutex;

    try {
      const tx = {
        order: {
          update: async (args: { where: { id: string }; data: any }) => {
            const order = this.orders.find((o) => o.id === args.where.id);
            if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
            Object.assign(order, args.data);
            return { ...order };
          },
          findUnique: async (args: { where: { id: string; customerId?: string }; include?: any }) => {
            const order = this.orders.find((o) => {
              if (o.id !== args.where.id) return false;
              if (args.where.customerId && o.customerId !== args.where.customerId) return false;
              return true;
            });
            if (!order) return null;
            const items = this.orderItems.filter((oi) => oi.orderId === order.id);
            const shipments = this.shipments
              .filter((s) => s.orderId === order.id)
              .map((s) => ({
                ...s,
                items: this.shipmentItems.filter((si) => si.shipmentId === s.id),
              }));
            const returnRequests = this.returnRequests
              .filter((rr) => rr.orderId === order.id)
              .map((rr) => ({
                ...rr,
                items: this.returnItems.filter((ri) => ri.returnRequestId === rr.id),
              }));
            return { ...order, items, shipments, returnRequests };
          },
        },
        orderItem: {
          findMany: async (args: { where: { orderId: string } }) => {
            return this.orderItems.filter((oi) => oi.orderId === args.where.orderId);
          },
          createMany: async (args: { data: any[] }) => {
            for (const itemData of args.data) {
              const newItem: OrderItem = {
                id: `oi-${Math.random().toString(36).substring(2, 9)}`,
                ...itemData,
              };
              this.orderItems.push(newItem);
            }
            return { count: args.data.length };
          },
        },
        inventory: {
          findFirst: async (args: { where: any }) => {
            return (
              this.inventories.find((inv) => {
                if (args.where.id && inv.id !== args.where.id) return false;
                if (args.where.warehouseId !== undefined && inv.warehouseId !== args.where.warehouseId) return false;
                if (args.where.variantId && inv.variantId !== args.where.variantId) return false;
                if (args.where.productId && inv.productId !== args.where.productId) return false;
                return true;
              }) || null
            );
          },
          findMany: async (args: { where: any }) => {
            return this.inventories.filter((inv) => {
              if (args.where.warehouseId !== undefined && inv.warehouseId !== args.where.warehouseId) return false;
              if (args.where.variantId && inv.variantId !== args.where.variantId) return false;
              if (args.where.productId && inv.productId !== args.where.productId) return false;
              return true;
            });
          },
          updateMany: async (args: { where: any; data: any }) => {
            let count = 0;
            for (const inv of this.inventories) {
              let match = true;
              if (args.where.id && inv.id !== args.where.id) match = false;
              if (args.where.quantityAvailable?.gte !== undefined) {
                if (inv.quantityAvailable < args.where.quantityAvailable.gte) match = false;
              }
              if (match) {
                if (args.data.quantityAvailable?.decrement !== undefined) {
                  inv.quantityAvailable -= args.data.quantityAvailable.decrement;
                }
                if (args.data.quantityAvailable?.increment !== undefined) {
                  inv.quantityAvailable += args.data.quantityAvailable.increment;
                }
                count++;
              }
            }
            return { count };
          },
          update: async (args: { where: { id: string }; data: any }) => {
            const inv = this.inventories.find((i) => i.id === args.where.id);
            if (!inv) throw new AppError("Inventory not found", 404, "NOT_FOUND");
            if (args.data.quantityAvailable?.increment !== undefined) {
              inv.quantityAvailable += args.data.quantityAvailable.increment;
            }
            if (args.data.quantityAvailable?.decrement !== undefined) {
              inv.quantityAvailable -= args.data.quantityAvailable.decrement;
            }
            return { ...inv };
          },
        },
        shipment: {
          create: async (args: { data: any; include?: any }) => {
            const shipmentId = `ship-${Math.random().toString(36).substring(2, 9)}`;
            const shipment: Shipment = {
              id: shipmentId,
              orderId: args.data.orderId,
              status: args.data.status,
              items: [],
            };
            if (args.data.items?.create) {
              for (const it of args.data.items.create) {
                const shipmentItem: ShipmentItem = {
                  id: `si-${Math.random().toString(36).substring(2, 9)}`,
                  shipmentId,
                  orderItemId: it.orderItemId,
                  warehouseId: it.warehouseId || null,
                  quantity: it.quantity,
                };
                this.shipmentItems.push(shipmentItem);
                shipment.items.push(shipmentItem);
              }
            }
            this.shipments.push(shipment);
            return shipment;
          },
        },
        returnRequest: {
          update: async (args: { where: { id: string }; data: any }) => {
            const req = this.returnRequests.find((r) => r.id === args.where.id);
            if (!req) throw new AppError("Return request not found", 404, "RETURN_NOT_FOUND");
            Object.assign(req, args.data);
            return { ...req };
          },
          findUnique: async (args: { where: { id: string }; include?: any }) => {
            const req = this.returnRequests.find((r) => r.id === args.where.id);
            if (!req) return null;
            const items = this.returnItems
              .filter((ri) => ri.returnRequestId === req.id)
              .map((ri) => ({
                ...ri,
                orderItem: this.orderItems.find((oi) => oi.id === ri.orderItemId)!,
              }));
            const order = this.orders.find((o) => o.id === req.orderId);
            return { ...req, items, order };
          },
          create: async (args: { data: any; include?: any }) => {
            const reqId = `ret-${Math.random().toString(36).substring(2, 9)}`;
            const retReq: ReturnRequest = {
              id: reqId,
              orderId: args.data.orderId,
              customerId: args.data.customerId,
              status: args.data.status,
              reason: args.data.reason,
              items: [],
              updatedAt: new Date(),
            };
            if (args.data.items?.create) {
              for (const it of args.data.items.create) {
                const retItem: ReturnItem = {
                  id: `ri-${Math.random().toString(36).substring(2, 9)}`,
                  returnRequestId: reqId,
                  orderItemId: it.orderItemId,
                  warehouseId: it.warehouseId || null,
                  quantity: it.quantity,
                };
                this.returnItems.push(retItem);
                retReq.items.push(retItem);
              }
            }
            this.returnRequests.push(retReq);
            return retReq;
          },
        },
        orderTimeline: {
          create: async () => ({ id: "tl-1" }),
        },
      };

      return await callback(tx);
    } finally {
      release!();
    }
  }

  // High-level operations following production service logic
  async checkout(
    cartItems: { productId: string; variantId?: string; quantity: number; unitPrice: number; targetWarehouseId?: string }[],
    customerId = "cust-1"
  ) {
    return await this.$transaction(async (tx) => {
      const validatedItems = [];
      const itemWarehouseMap = new Map<string, string | null>();

      for (const item of cartItems) {
        if (item.variantId) {
          const inventories = await tx.inventory.findMany({
            where: { variantId: item.variantId },
          });

          // Select the specific warehouse with sufficient available stock
          const targetInventory = item.targetWarehouseId
            ? inventories.find((inv: any) => inv.warehouseId === item.targetWarehouseId && inv.quantityAvailable - inv.quantityReserved >= item.quantity)
            : inventories.find((inv: any) => inv.quantityAvailable - inv.quantityReserved >= item.quantity);

          if (!targetInventory) {
            throw new AppError("Insufficient stock in any single warehouse", 409, "INSUFFICIENT_STOCK");
          }

          const updated = await tx.inventory.updateMany({
            where: {
              id: targetInventory.id,
              quantityAvailable: { gte: item.quantity + (targetInventory.quantityReserved || 0) },
            },
            data: {
              quantityAvailable: { decrement: item.quantity },
            },
          });

          if (updated.count === 0) {
            throw new AppError("Insufficient stock during checkout", 409, "INSUFFICIENT_STOCK");
          }

          itemWarehouseMap.set(item.productId, targetInventory.warehouseId || null);
        } else {
          const inv = await tx.inventory.findFirst({
            where: { productId: item.productId },
          });
          if (!inv) {
            throw new AppError("No inventory record found", 409, "INSUFFICIENT_STOCK");
          }
          const availableStock = inv.quantityAvailable - inv.quantityReserved;
          if (item.quantity > availableStock) {
            throw new AppError("Insufficient stock", 409, "INSUFFICIENT_STOCK");
          }
          const updated = await tx.inventory.updateMany({
            where: {
              id: inv.id,
              quantityAvailable: { gte: item.quantity + inv.quantityReserved },
            },
            data: {
              quantityAvailable: { decrement: item.quantity },
            },
          });
          if (updated.count === 0) {
            throw new AppError("Insufficient stock during checkout", 409, "INSUFFICIENT_STOCK");
          }
          itemWarehouseMap.set(item.productId, inv.warehouseId || null);
        }

        validatedItems.push({
          ...item,
          warehouseId: itemWarehouseMap.get(item.productId) || null,
        });
      }

      const orderId = `ord-${Math.random().toString(36).substring(2, 9)}`;
      const order: Order = {
        id: orderId,
        orderNumber: `ORD-${Date.now()}`,
        status: "Pending",
        paymentStatus: "Paid",
        customerId,
        updatedAt: new Date(),
      };
      this.orders.push(order);

      const orderItemPayloads = validatedItems.map((v) => ({
        orderId: order.id,
        productId: v.productId,
        productVariantId: v.variantId || null,
        warehouseId: v.warehouseId,
        quantity: v.quantity,
        price: v.unitPrice,
      }));

      await tx.orderItem.createMany({ data: orderItemPayloads });

      return { order, items: this.orderItems.filter((i) => i.orderId === order.id) };
    });
  }

  async createShipment(orderId: string, items: { orderItemId: string; quantity: number }[]) {
    return await this.$transaction(async (tx) => {
      // 1. Lock Order row
      await tx.order.update({
        where: { id: orderId },
        data: { updatedAt: new Date() },
      });

      // 2. Re-read fresh state with items & shipments under lock
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
      if (order.status === "Cancelled") throw new AppError("Cannot create shipment for cancelled order", 400, "ORDER_CANCELLED");

      const orderItemMap = new Map<string, OrderItem>(order.items.map((i: any) => [i.id, i]));
      const shippedMap = new Map<string, number>();

      for (const shipment of order.shipments) {
        for (const item of shipment.items) {
          shippedMap.set(item.orderItemId, (shippedMap.get(item.orderItemId) || 0) + item.quantity);
        }
      }

      for (const item of items) {
        if (!item.quantity || item.quantity <= 0) {
          throw new AppError("Shipment item quantity must be greater than zero", 400, "INVALID_QUANTITY");
        }
        const orderItem = orderItemMap.get(item.orderItemId);
        if (!orderItem) throw new AppError(`Item ${item.orderItemId} is not part of this order`, 400, "INVALID_ITEM");

        const orderedQty = orderItem.quantity;
        const previouslyShipped = shippedMap.get(item.orderItemId) || 0;
        const remainingToShip = orderedQty - previouslyShipped;

        if (item.quantity > remainingToShip) {
          throw new AppError(
            `Cannot ship ${item.quantity} of item ${item.orderItemId}. Only ${remainingToShip} remaining.`,
            400,
            "EXCEEDS_ORDERED_QUANTITY"
          );
        }
        shippedMap.set(item.orderItemId, previouslyShipped + item.quantity);
      }

      // 3. Create Shipment copying OrderItem.warehouseId -> ShipmentItem.warehouseId
      const shipment = await tx.shipment.create({
        data: {
          orderId,
          status: ShipmentStatus.PENDING,
          items: {
            create: items.map((i) => {
              const orderItem = orderItemMap.get(i.orderItemId)!;
              return {
                orderItemId: i.orderItemId,
                warehouseId: orderItem.warehouseId || null,
                quantity: i.quantity,
              };
            }),
          },
        },
      });

      return shipment;
    });
  }

  async cancelOrder(orderId: string) {
    return await this.$transaction(async (tx) => {
      // Row lock Order
      const currentOrder = await tx.order.update({
        where: { id: orderId },
        data: { updatedAt: new Date() },
      });

      if (!currentOrder) throw new AppError("Order not found", 404, "NOT_FOUND");
      if (currentOrder.status === "Cancelled") {
        return { order: currentOrder, restored: false };
      }

      const lowerStatus = currentOrder.status.toLowerCase();
      if (lowerStatus === "shipped" || lowerStatus === "delivered") {
        throw new AppError(`Cannot cancel an order that is already ${currentOrder.status}`, 400, "INVALID_ORDER_STATE");
      }

      const orderItems = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of orderItems) {
        if (item.warehouseId) {
          let inv;
          if (item.productVariantId) {
            inv = await tx.inventory.findFirst({
              where: { warehouseId: item.warehouseId, variantId: item.productVariantId },
            });
          } else {
            inv = await tx.inventory.findFirst({
              where: { warehouseId: item.warehouseId, productId: item.productId },
            });
          }

          if (!inv) {
            throw new AppError(`No inventory record found for warehouse ${item.warehouseId} to restock.`, 409, "INVENTORY_NOT_FOUND");
          }

          await tx.inventory.update({
            where: { id: inv.id },
            data: { quantityAvailable: { increment: item.quantity } },
          });
        } else {
          // Historical order fallback with NULL warehouseId
          let matchingInventories;
          if (item.productVariantId) {
            matchingInventories = await tx.inventory.findMany({
              where: { variantId: item.productVariantId },
            });
          } else {
            matchingInventories = await tx.inventory.findMany({
              where: { productId: item.productId },
            });
          }

          if (matchingInventories.length === 0) {
            throw new AppError("No inventory record found to restock.", 409, "INVENTORY_NOT_FOUND");
          } else if (matchingInventories.length === 1) {
            await tx.inventory.update({
              where: { id: matchingInventories[0].id },
              data: { quantityAvailable: { increment: item.quantity } },
            });
          } else {
            throw new AppError(
              "INVENTORY_WAREHOUSE_ORIGIN_UNKNOWN: Cannot determine fulfillment warehouse for historical order with multiple warehouses.",
              409,
              "INVENTORY_WAREHOUSE_ORIGIN_UNKNOWN"
            );
          }
        }
      }

      // 4. Update status to Cancelled
      await tx.order.update({
        where: { id: orderId },
        data: { status: "Cancelled" },
      });

      return { order: { ...currentOrder, status: "Cancelled" }, restored: true };
    });
  }

  async requestReturn(customerId: string, orderId: string, reason: string, items: { orderItemId: string; quantity: number }[]) {
    return await this.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { updatedAt: new Date() },
      });

      const order = await tx.order.findUnique({
        where: { id: orderId, customerId },
      });

      if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
      if (order.status.toLowerCase() !== "delivered") {
        throw new AppError(`Only delivered orders can be returned`, 400, "ORDER_NOT_DELIVERED");
      }

      const orderItemObjMap = new Map<string, OrderItem>(order.items.map((i: any) => [i.id, i]));
      const orderItemMap = new Map<string, number>(order.items.map((i: any) => [i.id, i.quantity]));
      const returnedMap = new Map<string, number>();

      for (const returnReq of order.returnRequests) {
        if (returnReq.status !== ReturnStatus.REJECTED && returnReq.status !== ReturnStatus.CLOSED) {
          for (const item of returnReq.items) {
            returnedMap.set(item.orderItemId, (returnedMap.get(item.orderItemId) || 0) + item.quantity);
          }
        }
      }

      for (const item of items) {
        const orderedQty = orderItemMap.get(item.orderItemId);
        if (orderedQty === undefined) throw new AppError(`Invalid item`, 400, "INVALID_ITEM");
        const previouslyReturned = returnedMap.get(item.orderItemId) || 0;
        if (item.quantity > orderedQty - previouslyReturned) {
          throw new AppError(`Exceeds ordered quantity`, 400, "EXCEEDS_ORDERED_QUANTITY");
        }
      }

      return await tx.returnRequest.create({
        data: {
          orderId,
          customerId,
          reason,
          status: ReturnStatus.REQUESTED,
          items: {
            create: items.map((i) => ({
              orderItemId: i.orderItemId,
              warehouseId: orderItemObjMap.get(i.orderItemId)?.warehouseId || null,
              quantity: i.quantity,
            })),
          },
        },
      });
    });
  }

  async receiveReturn(returnRequestId: string) {
    return await this.$transaction(async (tx) => {
      const lockedReq = await tx.returnRequest.update({
        where: { id: returnRequestId },
        data: { updatedAt: new Date() },
      });
      if (!lockedReq) throw new AppError("Return request not found", 404, "RETURN_NOT_FOUND");

      const returnReq = await tx.returnRequest.findUnique({
        where: { id: returnRequestId },
      });
      if (!returnReq) throw new AppError("Return request not found", 404, "RETURN_NOT_FOUND");
      if (returnReq.status === ReturnStatus.RECEIVED) {
        throw new AppError("Return request has already been marked as RECEIVED", 400, "RETURN_ALREADY_RECEIVED");
      }
      if (returnReq.status !== ReturnStatus.APPROVED) {
        throw new AppError(`Cannot receive return from status ${returnReq.status}`, 400, "INVALID_STATUS");
      }

      // Restock inventory strictly into authoritative warehouse
      for (const item of returnReq.items) {
        const orderItem = item.orderItem;
        const targetWarehouseId = item.warehouseId || orderItem.warehouseId;

        if (targetWarehouseId) {
          let targetInv;
          if (orderItem.productVariantId) {
            targetInv = await tx.inventory.findFirst({
              where: { warehouseId: targetWarehouseId, variantId: orderItem.productVariantId },
            });
          } else {
            targetInv = await tx.inventory.findFirst({
              where: { warehouseId: targetWarehouseId, productId: orderItem.productId },
            });
          }

          if (!targetInv) {
            throw new AppError(`No inventory record found for warehouse ${targetWarehouseId} to restock.`, 409, "INVENTORY_NOT_FOUND");
          }

          await tx.inventory.update({
            where: { id: targetInv.id },
            data: { quantityAvailable: { increment: item.quantity } },
          });
        } else {
          // Historical fallback
          let matchingInventories;
          if (orderItem.productVariantId) {
            matchingInventories = await tx.inventory.findMany({
              where: { variantId: orderItem.productVariantId },
            });
          } else {
            matchingInventories = await tx.inventory.findMany({
              where: { productId: orderItem.productId },
            });
          }

          if (matchingInventories.length === 0) {
            throw new AppError("No inventory record found to restock.", 409, "INVENTORY_NOT_FOUND");
          } else if (matchingInventories.length === 1) {
            await tx.inventory.update({
              where: { id: matchingInventories[0].id },
              data: { quantityAvailable: { increment: item.quantity } },
            });
          } else {
            throw new AppError(
              "INVENTORY_WAREHOUSE_ORIGIN_UNKNOWN: Cannot determine fulfillment warehouse for historical return item.",
              409,
              "INVENTORY_WAREHOUSE_ORIGIN_UNKNOWN"
            );
          }
        }
      }

      const updated = await tx.returnRequest.update({
        where: { id: returnRequestId },
        data: { status: ReturnStatus.RECEIVED },
      });

      return updated;
    });
  }
}

// ============================================================================
// TEST SUITE: MULTI-WAREHOUSE INVENTORY ORIGIN & LIFECYCLE
// ============================================================================

async function runTests() {
  const store = new MultiWarehouseMockStore();
  let passedCount = 0;
  let failedCount = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      store.reset();
      await fn();
      console.log(`  ✓ PASSED: ${name}`);
      passedCount++;
    } catch (err: any) {
      console.error(`  ✗ FAILED: ${name}`);
      console.error(`    Error: ${err.message}`);
      if (err.stack) console.error(err.stack);
      failedCount++;
    }
  }

  console.log("=========================================================");
  console.log("RUNNING MULTI-WAREHOUSE INVENTORY ORIGIN VERIFICATION");
  console.log("=========================================================");

  // --- Suite 1: Checkout Fulfillment & Warehouse Allocation ---
  console.log("\n--- Suite 1: Checkout Fulfillment & Warehouse Allocation ---");

  await test("1.1 Warehouse A Fulfillment: Stock decremented only from Warehouse A & OrderItem.warehouseId = wh-A", async () => {
    store.inventories = [
      { id: "inv-A", warehouseId: "wh-A", variantId: "var-1", quantityAvailable: 10, quantityReserved: 0 },
      { id: "inv-B", warehouseId: "wh-B", variantId: "var-1", quantityAvailable: 0, quantityReserved: 0 },
    ];

    const result = await store.checkout([{ productId: "prod-1", variantId: "var-1", quantity: 3, unitPrice: 50 }]);
    const orderItem = result.items[0];

    assert.strictEqual(orderItem.warehouseId, "wh-A", "OrderItem.warehouseId must be wh-A");
    assert.strictEqual(store.inventories.find((i) => i.id === "inv-A")?.quantityAvailable, 7, "Warehouse A stock decremented 10 -> 7");
    assert.strictEqual(store.inventories.find((i) => i.id === "inv-B")?.quantityAvailable, 0, "Warehouse B stock remains 0");
  });

  await test("1.2 Warehouse B Fulfillment: Stock decremented only from Warehouse B & OrderItem.warehouseId = wh-B", async () => {
    store.inventories = [
      { id: "inv-A", warehouseId: "wh-A", variantId: "var-1", quantityAvailable: 0, quantityReserved: 0 },
      { id: "inv-B", warehouseId: "wh-B", variantId: "var-1", quantityAvailable: 15, quantityReserved: 0 },
    ];

    const result = await store.checkout([{ productId: "prod-1", variantId: "var-1", quantity: 4, unitPrice: 50 }]);
    const orderItem = result.items[0];

    assert.strictEqual(orderItem.warehouseId, "wh-B", "OrderItem.warehouseId must be wh-B");
    assert.strictEqual(store.inventories.find((i) => i.id === "inv-B")?.quantityAvailable, 11, "Warehouse B stock decremented 15 -> 11");
    assert.strictEqual(store.inventories.find((i) => i.id === "inv-A")?.quantityAvailable, 0, "Warehouse A stock remains 0");
  });

  // --- Suite 2: Shipment Creation & Propagation ---
  console.log("\n--- Suite 2: Shipment Creation & Propagation ---");

  await test("2.1 Shipment Creation: OrderItem.warehouseId propagates to ShipmentItem.warehouseId", async () => {
    store.inventories = [
      { id: "inv-B", warehouseId: "wh-B", variantId: "var-1", quantityAvailable: 10, quantityReserved: 0 },
    ];

    const { order, items } = await store.checkout([{ productId: "prod-1", variantId: "var-1", quantity: 5, unitPrice: 50 }]);
    const orderItemId = items[0].id;

    const shipment = await store.createShipment(order.id, [{ orderItemId, quantity: 5 }]);
    assert.strictEqual(shipment.items.length, 1);
    assert.strictEqual(shipment.items[0].warehouseId, "wh-B", "ShipmentItem.warehouseId must match OrderItem.warehouseId (wh-B)");
    assert.strictEqual(shipment.items[0].quantity, 5);
  });

  await test("2.2 Partial Shipment: Each partial shipment inherits OrderItem.warehouseId and tracks quantity accurately", async () => {
    store.inventories = [
      { id: "inv-B", warehouseId: "wh-B", variantId: "var-1", quantityAvailable: 10, quantityReserved: 0 },
    ];

    const { order, items } = await store.checkout([{ productId: "prod-1", variantId: "var-1", quantity: 5, unitPrice: 50 }]);
    const orderItemId = items[0].id;

    // Partial shipment 1: 2 units
    const shipment1 = await store.createShipment(order.id, [{ orderItemId, quantity: 2 }]);
    assert.strictEqual(shipment1.items[0].warehouseId, "wh-B");
    assert.strictEqual(shipment1.items[0].quantity, 2);

    // Partial shipment 2: remaining 3 units
    const shipment2 = await store.createShipment(order.id, [{ orderItemId, quantity: 3 }]);
    assert.strictEqual(shipment2.items[0].warehouseId, "wh-B");
    assert.strictEqual(shipment2.items[0].quantity, 3);

    // Excess shipment 3: 1 unit beyond ordered -> strictly rejected
    let excessError: any = null;
    try {
      await store.createShipment(order.id, [{ orderItemId, quantity: 1 }]);
    } catch (e) {
      excessError = e;
    }
    assert(excessError !== null, "Excess partial shipment must throw error");
    assert.strictEqual(excessError.code, "EXCEEDS_ORDERED_QUANTITY");
  });

  // --- Suite 3: Order Cancellation Restocking ---
  console.log("\n--- Suite 3: Order Cancellation Restocking ---");

  await test("3.1 Cancellation: Stock is restored ONLY to fulfilling warehouse (wh-B), leaving other warehouses untouched", async () => {
    store.inventories = [
      { id: "inv-A", warehouseId: "wh-A", variantId: "var-1", quantityAvailable: 20, quantityReserved: 0 },
      { id: "inv-B", warehouseId: "wh-B", variantId: "var-1", quantityAvailable: 10, quantityReserved: 0 },
    ];

    // Fulfill specifically from warehouse B
    const { order } = await store.checkout([{ productId: "prod-1", variantId: "var-1", quantity: 4, unitPrice: 50, targetWarehouseId: "wh-B" }]);
    assert.strictEqual(store.inventories.find((i) => i.id === "inv-B")?.quantityAvailable, 6);
    assert.strictEqual(store.inventories.find((i) => i.id === "inv-A")?.quantityAvailable, 20);

    // Cancel order
    const cancelRes = await store.cancelOrder(order.id);
    assert.strictEqual(cancelRes.restored, true);
    assert.strictEqual(store.inventories.find((i) => i.id === "inv-B")?.quantityAvailable, 10, "Warehouse B stock restored 6 -> 10");
    assert.strictEqual(store.inventories.find((i) => i.id === "inv-A")?.quantityAvailable, 20, "Warehouse A stock strictly untouched at 20");
  });

  await test("3.2 Concurrent Cancellation: Exactly one execution restores stock; second is safely idempotent", async () => {
    store.inventories = [
      { id: "inv-B", warehouseId: "wh-B", variantId: "var-1", quantityAvailable: 10, quantityReserved: 0 },
    ];

    const { order } = await store.checkout([{ productId: "prod-1", variantId: "var-1", quantity: 3, unitPrice: 50 }]);
    assert.strictEqual(store.inventories[0].quantityAvailable, 7);

    // Execute concurrent cancellations
    const [res1, res2] = await Promise.all([
      store.cancelOrder(order.id),
      store.cancelOrder(order.id),
    ]);

    // Only one execution should have restored stock
    const restoredCount = (res1.restored ? 1 : 0) + (res2.restored ? 1 : 0);
    assert.strictEqual(restoredCount, 1, "Exactly one cancellation restored inventory");
    assert.strictEqual(store.inventories[0].quantityAvailable, 10, "Inventory restored to original 10, not double-incremented to 13");
  });

  // --- Suite 4: Return Lifecycle & Restocking ---
  console.log("\n--- Suite 4: Return Lifecycle & Restocking ---");

  await test("4.1 Return Receipt: Restores stock ONLY to warehouse B upon RECEIVED transition", async () => {
    store.inventories = [
      { id: "inv-A", warehouseId: "wh-A", variantId: "var-1", quantityAvailable: 50, quantityReserved: 0 },
      { id: "inv-B", warehouseId: "wh-B", variantId: "var-1", quantityAvailable: 10, quantityReserved: 0 },
    ];

    const { order, items } = await store.checkout([{ productId: "prod-1", variantId: "var-1", quantity: 4, unitPrice: 50, targetWarehouseId: "wh-B" }]);
    const orderItemId = items[0].id;
    order.status = "Delivered"; // Mark delivered to allow return

    const retReq = await store.requestReturn("cust-1", order.id, "Defective item", [{ orderItemId, quantity: 2 }]);
    assert.strictEqual(retReq.items[0].warehouseId, "wh-B", "ReturnItem inherited warehouseId wh-B");

    retReq.status = ReturnStatus.APPROVED; // Admin approves return

    // Admin receives return -> restocks warehouse B
    await store.receiveReturn(retReq.id);

    assert.strictEqual(store.inventories.find((i) => i.id === "inv-B")?.quantityAvailable, 8, "Warehouse B stock restocked 6 -> 8");
    assert.strictEqual(store.inventories.find((i) => i.id === "inv-A")?.quantityAvailable, 50, "Warehouse A stock strictly untouched at 50");
  });

  await test("4.2 Concurrent Return Receipt: Duplicate receive calls prevent double-restocking with idempotency check", async () => {
    store.inventories = [
      { id: "inv-B", warehouseId: "wh-B", variantId: "var-1", quantityAvailable: 10, quantityReserved: 0 },
    ];

    const { order, items } = await store.checkout([{ productId: "prod-1", variantId: "var-1", quantity: 4, unitPrice: 50 }]);
    order.status = "Delivered";

    const retReq = await store.requestReturn("cust-1", order.id, "Wrong size", [{ orderItemId: items[0].id, quantity: 2 }]);
    retReq.status = ReturnStatus.APPROVED;

    // Concurrent receive calls
    const results = await Promise.allSettled([
      store.receiveReturn(retReq.id),
      store.receiveReturn(retReq.id),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    assert.strictEqual(fulfilled.length, 1, "Exactly one return receive call succeeded");
    assert.strictEqual(rejected.length, 1, "Second receive call rejected");
    assert.strictEqual(store.inventories[0].quantityAvailable, 8, "Inventory incremented from 6 to 8 (not 10)");
  });

  // --- Suite 5: Historical Orders (NULL warehouseId) Fallback & Safety ---
  console.log("\n--- Suite 5: Historical Orders (NULL warehouseId) Fallback & Safety ---");

  await test("5.1 Historical Order with Exactly One Warehouse: Safely falls back to restock the single inventory record", async () => {
    store.inventories = [
      { id: "inv-single", warehouseId: "wh-legacy", variantId: "var-hist", quantityAvailable: 5, quantityReserved: 0 },
    ];

    // Seed historical order with warehouseId = null
    const histOrder: Order = {
      id: "ord-hist-1",
      orderNumber: "ORD-HIST-001",
      status: "Pending",
      paymentStatus: "Paid",
      customerId: "cust-1",
      updatedAt: new Date(),
    };
    store.orders.push(histOrder);
    store.orderItems.push({
      id: "oi-hist-1",
      orderId: histOrder.id,
      productId: "prod-hist",
      productVariantId: "var-hist",
      warehouseId: null, // Historical NULL
      quantity: 2,
      price: 40,
    });

    const cancelRes = await store.cancelOrder(histOrder.id);
    assert.strictEqual(cancelRes.restored, true);
    assert.strictEqual(store.inventories[0].quantityAvailable, 7, "Stock restored 5 -> 7 on single warehouse fallback");
  });

  await test("5.2 Historical Order with Multiple Warehouses: Strictly throws INVENTORY_WAREHOUSE_ORIGIN_UNKNOWN and NEVER guesses", async () => {
    store.inventories = [
      { id: "inv-A", warehouseId: "wh-A", variantId: "var-multi", quantityAvailable: 10, quantityReserved: 0 },
      { id: "inv-B", warehouseId: "wh-B", variantId: "var-multi", quantityAvailable: 20, quantityReserved: 0 },
    ];

    const histOrder: Order = {
      id: "ord-hist-2",
      orderNumber: "ORD-HIST-002",
      status: "Pending",
      paymentStatus: "Paid",
      customerId: "cust-1",
      updatedAt: new Date(),
    };
    store.orders.push(histOrder);
    store.orderItems.push({
      id: "oi-hist-2",
      orderId: histOrder.id,
      productId: "prod-multi",
      productVariantId: "var-multi",
      warehouseId: null, // Historical NULL with 2 warehouses existing!
      quantity: 3,
      price: 40,
    });

    let caughtError: any = null;
    try {
      await store.cancelOrder(histOrder.id);
    } catch (err) {
      caughtError = err;
    }

    assert(caughtError !== null, "Must throw error for ambiguous historical warehouse origin");
    assert.strictEqual(caughtError.code, "INVENTORY_WAREHOUSE_ORIGIN_UNKNOWN");
    assert.strictEqual(store.inventories[0].quantityAvailable, 10, "Warehouse A untouched");
    assert.strictEqual(store.inventories[1].quantityAvailable, 20, "Warehouse B untouched");
  });

  // --- Suite 6: Missing Inventory Error Handling ---
  console.log("\n--- Suite 6: Missing Inventory Error Handling ---");

  await test("6.1 Missing Inventory Record: Cancellation throws INVENTORY_NOT_FOUND and does not corrupt state", async () => {
    store.inventories = []; // No inventory records exist

    const order: Order = {
      id: "ord-missing",
      orderNumber: "ORD-MISSING",
      status: "Pending",
      paymentStatus: "Paid",
      customerId: "cust-1",
      updatedAt: new Date(),
    };
    store.orders.push(order);
    store.orderItems.push({
      id: "oi-missing",
      orderId: order.id,
      productId: "prod-1",
      productVariantId: "var-1",
      warehouseId: "wh-non-existent",
      quantity: 1,
      price: 30,
    });

    let caughtError: any = null;
    try {
      await store.cancelOrder(order.id);
    } catch (err) {
      caughtError = err;
    }

    assert(caughtError !== null, "Must throw INVENTORY_NOT_FOUND");
    assert.strictEqual(caughtError.code, "INVENTORY_NOT_FOUND");
  });

  console.log("\n=========================================================");
  console.log(`TEST SUMMARY: ${passedCount}/${passedCount + failedCount} Passed, ${failedCount} Failed`);
  console.log("=========================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
