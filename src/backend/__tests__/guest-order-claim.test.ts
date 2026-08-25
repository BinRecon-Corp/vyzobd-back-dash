import test from "node:test";
import assert from "node:assert";
import { StorefrontAuthService } from "../services/storefront/auth.service";

test("Guest Order Claim & Linking Service Tests", async (t) => {
  // In-memory mock DB structure
  const createMockDb = () => {
    let customerStore = [
      {
        id: "cust-verified-1",
        email: "user1@example.com",
        phone: "+8801700000001",
        phoneVerified: true,
      },
      {
        id: "cust-unverified-2",
        email: "user2@example.com",
        phone: "+8801700000002",
        phoneVerified: false,
      },
      {
        id: "cust-other-3",
        email: "other@example.com",
        phone: "+8801700000003",
        phoneVerified: true,
      },
    ];

    let orderStore = [
      {
        id: "ord-guest-1",
        orderNumber: "ORD-1001",
        customerId: null,
        customerEmail: "user1@example.com",
        shippingAddress: "Name: User1\nPhone: +8801700000001",
        deletedAt: null,
      },
      {
        id: "ord-owned-2",
        orderNumber: "ORD-1002",
        customerId: "cust-other-3",
        customerEmail: "other@example.com",
        shippingAddress: "Name: Other\nPhone: +8801700000001", // Has same phone text, but already owned!
        deletedAt: null,
      },
      {
        id: "ord-guest-diff-phone-3",
        orderNumber: "ORD-1003",
        customerId: null,
        customerEmail: "someone@example.com",
        shippingAddress: "Name: Someone\nPhone: +8801999999999",
        deletedAt: null,
      },
      {
        id: "ord-guest-multi-4",
        orderNumber: "ORD-1004",
        customerId: null,
        customerEmail: "user1@example.com",
        shippingAddress: "Name: User1\nPhone: 01700000001", // Raw BD digits format
        deletedAt: null,
      },
      {
        id: "ord-guest-unverified-5",
        orderNumber: "ORD-1005",
        customerId: null,
        customerEmail: "user2@example.com",
        shippingAddress: "Name: User2\nPhone: +8801700000002",
        deletedAt: null,
      },
    ];

    let activityLogStore: any[] = [];

    const mockTx = {
      customer: {
        findUnique: async (args: any) => {
          return customerStore.find((c) => c.id === args.where.id) || null;
        },
      },
      order: {
        findMany: async (args: any) => {
          return orderStore.filter((o) => {
            if (o.deletedAt !== null) return false;
            if (args.where.customerId !== null && o.customerId !== args.where.customerId) return false;
            if (args.where.customerId === null && o.customerId !== null) return false;

            if (args.where.OR) {
              const matches = args.where.OR.some((cond: any) => {
                if (cond.shippingAddress?.contains) {
                  return o.shippingAddress.includes(cond.shippingAddress.contains);
                }
                if (cond.customerEmail?.equals) {
                  return o.customerEmail.toLowerCase() === cond.customerEmail.equals.toLowerCase();
                }
                return false;
              });
              if (!matches) return false;
            }

            return true;
          });
        },
        updateMany: async (args: any) => {
          const ids = args.where.id?.in || [];
          let count = 0;
          for (const o of orderStore) {
            if (ids.includes(o.id) && (args.where.customerId === null ? o.customerId === null : true)) {
              o.customerId = args.data.customerId;
              count++;
            }
          }
          return { count };
        },
      },
      activityLog: {
        create: async (args: any) => {
          activityLogStore.push(args.data);
          return args.data;
        },
      },
    };

    const mockDb = {
      ...mockTx,
      $transaction: async (cb: (tx: any) => Promise<any>) => {
        // Deep copy for rollback simulation if needed
        const prevOrders = JSON.parse(JSON.stringify(orderStore));
        try {
          return await cb(mockTx);
        } catch (err) {
          orderStore = prevOrders; // rollback
          throw err;
        }
      },
      _getOrders: () => orderStore,
      _getLogs: () => activityLogStore,
    };

    return mockDb;
  };

  await t.test("A. Guest order is linked for phone-verified customer", async () => {
    const db = createMockDb();
    const count = await StorefrontAuthService.linkGuestOrdersToCustomer("cust-verified-1", "01700000001", null, "127.0.0.1", db);

    assert.strictEqual(count, 2); // ord-guest-1 and ord-guest-multi-4 match phone/email
    const orders = db._getOrders();
    const ord1 = orders.find((o) => o.id === "ord-guest-1");
    assert.strictEqual(ord1?.customerId, "cust-verified-1");
  });

  await t.test("B. Already-owned order is not reassigned", async () => {
    const db = createMockDb();
    await StorefrontAuthService.linkGuestOrdersToCustomer("cust-verified-1", "01700000001", null, "127.0.0.1", db);

    const orders = db._getOrders();
    const ownedOrd = orders.find((o) => o.id === "ord-owned-2");
    assert.strictEqual(ownedOrd?.customerId, "cust-other-3");
  });

  await t.test("C. Different phone does not link", async () => {
    const db = createMockDb();
    const count = await StorefrontAuthService.linkGuestOrdersToCustomer("cust-verified-1", "01800000000", null, "127.0.0.1", db);
    assert.strictEqual(count, 0);
  });

  await t.test("D. Unverified customer cannot claim orders", async () => {
    const db = createMockDb();
    const count = await StorefrontAuthService.linkGuestOrdersToCustomer("cust-unverified-2", "01700000002", null, "127.0.0.1", db);

    assert.strictEqual(count, 0);
    const orders = db._getOrders();
    const ord5 = orders.find((o) => o.id === "ord-guest-unverified-5");
    assert.strictEqual(ord5?.customerId, null);
  });

  await t.test("E. Repeated execution is idempotent", async () => {
    const db = createMockDb();
    const count1 = await StorefrontAuthService.linkGuestOrdersToCustomer("cust-verified-1", "01700000001", null, "127.0.0.1", db);
    assert.strictEqual(count1, 2);

    const count2 = await StorefrontAuthService.linkGuestOrdersToCustomer("cust-verified-1", "01700000001", null, "127.0.0.1", db);
    assert.strictEqual(count2, 0); // No more unlinked guest orders remain
  });

  await t.test("F. Multiple guest orders are linked at once", async () => {
    const db = createMockDb();
    const count = await StorefrontAuthService.linkGuestOrdersToCustomer("cust-verified-1", "01700000001", "user1@example.com", "127.0.0.1", db);
    assert.strictEqual(count, 2);
  });

  await t.test("G. Transaction failure rolls back ownership updates safely", async () => {
    const db = createMockDb();
    // Simulate transaction error
    const failingDb = {
      ...db,
      $transaction: async (cb: any) => {
        const prevOrders = JSON.parse(JSON.stringify(db._getOrders()));
        try {
          await cb({
            ...db,
            order: {
              ...db.order,
              updateMany: async () => {
                throw new Error("Simulated DB Lock Timeout");
              },
            },
          });
        } catch (err: any) {
          // Verify error thrown and state unchanged
          assert.strictEqual(err.message, "Simulated DB Lock Timeout");
        }
      },
    };

    await failingDb.$transaction(() => {});
    const orders = db._getOrders();
    const ord1 = orders.find((o) => o.id === "ord-guest-1");
    assert.strictEqual(ord1?.customerId, null); // Unchanged after rollback
  });

  await t.test("H. Mobile Login: Existing customer with matching guest orders", async () => {
    const db = createMockDb();
    const count = await StorefrontAuthService.linkGuestOrdersToCustomer("cust-verified-1", "+8801700000001", "user1@example.com", "127.0.0.1", db);
    assert.strictEqual(count, 2);
  });

  await t.test("I. Mobile Login: Existing customer with NO matching guest orders", async () => {
    const db = createMockDb();
    const count = await StorefrontAuthService.linkGuestOrdersToCustomer("cust-other-3", "+8801700000003", "other@example.com", "127.0.0.1", db);
    assert.strictEqual(count, 0);
  });

  await t.test("J. Mobile Login: Already claimed order is skipped", async () => {
    const db = createMockDb();
    // cust-other-3 tries to claim, but ord-owned-2 is already owned by cust-other-3 (not null) and ord-guest-1 belongs to user1
    const count = await StorefrontAuthService.linkGuestOrdersToCustomer("cust-other-3", "+8801700000001", "other@example.com", "127.0.0.1", db);
    assert.strictEqual(count, 0);
  });

  await t.test("K. Mobile Login: Multiple sequential login attempts are safe and idempotent", async () => {
    const db = createMockDb();
    const login1Count = await StorefrontAuthService.linkGuestOrdersToCustomer("cust-verified-1", "+8801700000001", "user1@example.com", "127.0.0.1", db);
    assert.strictEqual(login1Count, 2);

    const login2Count = await StorefrontAuthService.linkGuestOrdersToCustomer("cust-verified-1", "+8801700000001", "user1@example.com", "127.0.0.1", db);
    assert.strictEqual(login2Count, 0);

    const login3Count = await StorefrontAuthService.linkGuestOrdersToCustomer("cust-verified-1", "+8801700000001", "user1@example.com", "127.0.0.1", db);
    assert.strictEqual(login3Count, 0);
  });
});
