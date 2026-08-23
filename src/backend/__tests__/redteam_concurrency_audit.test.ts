import { PrismaClient, Prisma, PaymentStatus, ReturnStatus, RefundStatus } from "@prisma/client";
import { StorefrontCheckoutService } from "../services/storefront/checkout.service";
import { AdminReturnService } from "../services/return.service";
import { StorefrontReturnService } from "../services/storefront/return.service";
import { AdminRefundService } from "../services/refund.service";
import { AdminShipmentService } from "../services/shipment.service";
import { PaymentSecurityService } from "../services/storefront/paymentSecurity.service";
import { updateOrderStatus } from "../controllers/order.controller";
import crypto from "crypto";

const prisma = new PrismaClient();

function callUpdateOrderStatus(orderId: string, status: string, reason: string = "Admin update") {
  return new Promise<any>((resolve, reject) => {
    const req: any = {
      params: { id: orderId },
      body: { status, internalNotes: reason },
      user: { id: "admin-1", email: "admin@example.com" },
    };
    const res: any = {
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        if (this.statusCode >= 400) {
          reject(data);
        } else {
          resolve(data);
        }
      },
    };
    const next = (err: any) => {
      if (err) reject(err);
      else resolve({ status: "success" });
    };

    updateOrderStatus(req, res, next);
  });
}

interface AuditRecord {
  scenarioId: number;
  scenarioName: string;
  requestAInitialState: any;
  requestBInitialState: any;
  expectedResult: string;
  actualResult: string;
  finalDbState: any;
  doubleMutationOccurred: boolean;
  rollbackOccurred: boolean;
  verifiedWithRealDb: boolean;
}

async function runRedTeamConcurrencyAudit() {
  console.log("=========================================================");
  console.log("STARTING REAL POSTGRESQL RED-TEAM CONCURRENCY AUDIT");
  console.log("=========================================================\n");

  const results: AuditRecord[] = [];

  // Helper to create base test data
  async function createTestCustomer(emailPrefix: string) {
    return await prisma.customer.create({
      data: {
        email: `${emailPrefix}_${Date.now()}_${Math.random()}@example.com`,
        firstName: "Test",
        lastName: "Customer",
        emailVerified: true,
      },
    });
  }

  async function createTestCategory() {
    return await prisma.category.create({
      data: {
        name: `TestCat_${Date.now()}_${Math.random()}`,
        slug: `test-cat-${Date.now()}-${Math.random()}`,
      },
    });
  }

  async function createTestWarehouse() {
    return await prisma.warehouse.create({
      data: {
        name: `WH_${Date.now()}_${Math.random()}`,
        code: `WH_CODE_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        address: "123 Test St",
      },
    });
  }

  async function createTestProductWithInventory(warehouseId: string, quantity: number) {
    const category = await createTestCategory();
    const product = await prisma.product.create({
      data: {
        title: `Test Product ${Date.now()}`,
        slug: `test-prod-${Date.now()}-${Math.random()}`,
        price: new Prisma.Decimal("100.00"),
        sku: `SKU-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        categoryId: category.id,
        isPublished: true,
      },
    });

    const inventory = await prisma.inventory.create({
      data: {
        productId: product.id,
        warehouseId,
        quantityAvailable: quantity,
      },
    });

    return { category, product, inventory };
  }

  async function createTestCoupon(codePrefix: string, usageLimit: number | null = 100) {
    return await prisma.coupon.create({
      data: {
        code: `${codePrefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        discountType: "FIXED",
        discountValue: new Prisma.Decimal("10.00"),
        validFrom: new Date(Date.now() - 100000),
        validUntil: new Date(Date.now() + 1000000),
        isActive: true,
        usedCount: 10,
        usageLimit,
      },
    });
  }

  // --- ATTACK 1: Two simultaneous checkouts for last stock ---
  try {
    console.log("--- Executing Attack 1: Two simultaneous checkouts for last stock ---");
    const warehouse = await createTestWarehouse();
    const { product, inventory } = await createTestProductWithInventory(warehouse.id, 1);
    const customerA = await createTestCustomer("checkoutA");
    const customerB = await createTestCustomer("checkoutB");

    // Create session carts
    const cartA = await prisma.cartSession.create({
      data: {
        customerId: customerA.id,
        items: {
          create: [{ productId: product.id, quantity: 1, unitPrice: new Prisma.Decimal("100.00") }],
        },
      },
    });

    const cartB = await prisma.cartSession.create({
      data: {
        customerId: customerB.id,
        items: {
          create: [{ productId: product.id, quantity: 1, unitPrice: new Prisma.Decimal("100.00") }],
        },
      },
    });

    const reqAInit = { cartId: cartA.id, stock: 1 };
    const reqBInit = { cartId: cartB.id, stock: 1 };

    let resA: any, resB: any;
    let errA: any = null, errB: any = null;

    await Promise.all([
      StorefrontCheckoutService.checkout({ cartId: cartA.id }, {
        shippingAddress: "Addr A", billingAddress: "Addr A", paymentMethod: "COD"
      }, customerA.id).then(r => resA = r).catch(e => errA = e),
      StorefrontCheckoutService.checkout({ cartId: cartB.id }, {
        shippingAddress: "Addr B", billingAddress: "Addr B", paymentMethod: "COD"
      }, customerB.id).then(r => resB = r).catch(e => errB = e),
    ]);

    const finalInv = await prisma.inventory.findUnique({ where: { id: inventory.id } });
    const ordersCreated = await prisma.order.findMany({
      where: { items: { some: { productId: product.id } } }
    });

    results.push({
      scenarioId: 1,
      scenarioName: "Two simultaneous checkouts for last stock",
      requestAInitialState: reqAInit,
      requestBInitialState: reqBInit,
      expectedResult: "Exactly ONE checkout succeeds, ONE fails due to stock, inventory remains >= 0",
      actualResult: `Orders created: ${ordersCreated.length}. Successes: ${[resA, resB].filter(Boolean).length}, Failures: ${[errA, errB].filter(Boolean).length}`,
      finalDbState: { inventoryQuantity: finalInv?.quantityAvailable, ordersCount: ordersCreated.length },
      doubleMutationOccurred: ordersCreated.length > 1 || (finalInv?.quantityAvailable ?? 0) < 0,
      rollbackOccurred: errA !== null || errB !== null,
      verifiedWithRealDb: true,
    });
  } catch (e: any) {
    console.error("Attack 1 error:", e);
  }

  // --- ATTACK 2: Two simultaneous cancellation requests ---
  try {
    console.log("--- Executing Attack 2: Two simultaneous cancellation requests ---");
    const warehouse = await createTestWarehouse();
    const { product, inventory } = await createTestProductWithInventory(warehouse.id, 10);
    const customer = await createTestCustomer("cancelCustomer");
    const coupon = await createTestCoupon("CANCEL_COUPON");

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-1`,
        customerId: customer.id,
        couponId: coupon.id,
        status: "Processing",
        paymentStatus: "Paid",
        subtotal: new Prisma.Decimal("100.00"),
        totalAmount: new Prisma.Decimal("90.00"),
        discountAmount: new Prisma.Decimal("10.00"),
        items: {
          create: [{ productId: product.id, warehouseId: warehouse.id, quantity: 2, unitPrice: new Prisma.Decimal("50.00"), totalAmount: new Prisma.Decimal("100.00") }],
        },
      },
    });

    const initCouponUsed = coupon.usedCount; // 10
    const initStock = inventory.quantityAvailable; // 10

    let errA: any = null, errB: any = null;

    await Promise.all([
      callUpdateOrderStatus(order.id, "Cancelled", "Cancel request A").catch(e => errA = e),
      callUpdateOrderStatus(order.id, "Cancelled", "Cancel request B").catch(e => errB = e),
    ]);

    const finalOrder = await prisma.order.findUnique({ where: { id: order.id } });
    const finalCoupon = await prisma.coupon.findUnique({ where: { id: coupon.id } });
    const finalInv = await prisma.inventory.findUnique({ where: { id: inventory.id } });

    // Expecting stock restored from 10 -> 12 ONCE (not 14) and coupon decremented 10 -> 9 ONCE (not 8)
    const stockDelta = (finalInv?.quantityAvailable ?? 0) - initStock;
    const couponDelta = initCouponUsed - (finalCoupon?.usedCount ?? 0);

    results.push({
      scenarioId: 2,
      scenarioName: "Two simultaneous cancellation requests",
      requestAInitialState: { orderStatus: "Processing", stock: 10, couponUsed: 10 },
      requestBInitialState: { orderStatus: "Processing", stock: 10, couponUsed: 10 },
      expectedResult: "Order status = Cancelled, stock restored exactly once (+2 -> 12), coupon decremented exactly once (10 -> 9)",
      actualResult: `Final order status: ${finalOrder?.status}, stockDelta: +${stockDelta}, couponDelta: -${couponDelta}`,
      finalDbState: {
        orderStatus: finalOrder?.status,
        paymentStatus: finalOrder?.paymentStatus,
        stock: finalInv?.quantityAvailable,
        couponUsedCount: finalCoupon?.usedCount
      },
      doubleMutationOccurred: stockDelta !== 2 || couponDelta !== 1,
      rollbackOccurred: errA !== null || errB !== null,
      verifiedWithRealDb: true,
    });
  } catch (e: any) {
    console.error("Attack 2 error:", e);
  }

  // --- ATTACK 3: Cancel vs shipment creation ---
  try {
    console.log("--- Executing Attack 3: Cancel vs shipment creation ---");
    const warehouse = await createTestWarehouse();
    const { product, inventory } = await createTestProductWithInventory(warehouse.id, 10);
    const customer = await createTestCustomer("shipCustomer");

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-SHIP`,
        customerId: customer.id,
        status: "Processing",
        paymentStatus: "Paid",
        subtotal: new Prisma.Decimal("100.00"),
        totalAmount: new Prisma.Decimal("100.00"),
        items: {
          create: [{ productId: product.id, warehouseId: warehouse.id, quantity: 2, unitPrice: new Prisma.Decimal("50.00"), totalAmount: new Prisma.Decimal("100.00") }],
        },
      },
      include: { items: true },
    });

    let resCancel: any = null, resShip: any = null;
    let errCancel: any = null, errShip: any = null;

    await Promise.all([
      callUpdateOrderStatus(order.id, "Cancelled", "Cancel request").then(r => resCancel = r).catch(e => errCancel = e),
      AdminShipmentService.createShipment({
        orderId: order.id,
        carrier: "DHL",
        trackingNumber: `TRACK-${Date.now()}`,
        items: [{ orderItemId: order.items[0].id, quantity: 2, warehouseId: warehouse.id }],
      }).then(r => resShip = r).catch(e => errShip = e),
    ]);

    const finalOrder = await prisma.order.findUnique({ where: { id: order.id } });
    const shipments = await prisma.shipment.findMany({ where: { orderId: order.id } });

    // Invariant 9: Cancelled orders cannot be shipped. If order is Cancelled, shipments count must be 0 or if shipped, status must NOT be Cancelled.
    const conflictOccurred = finalOrder?.status === "Cancelled" && shipments.length > 0;

    results.push({
      scenarioId: 3,
      scenarioName: "Cancel vs shipment creation",
      requestAInitialState: { action: "Cancel Order", orderStatus: "Processing" },
      requestBInitialState: { action: "Create Shipment", orderStatus: "Processing" },
      expectedResult: "Either Cancellation succeeds & Shipment is blocked OR Shipment succeeds & Cancellation is blocked. Never both.",
      actualResult: `Final Order Status: ${finalOrder?.status}, Shipments count: ${shipments.length}`,
      finalDbState: { orderStatus: finalOrder?.status, shipmentsCount: shipments.length },
      doubleMutationOccurred: conflictOccurred,
      rollbackOccurred: errCancel !== null || errShip !== null,
      verifiedWithRealDb: true,
    });
  } catch (e: any) {
    console.error("Attack 3 error:", e);
  }

  // --- ATTACK 4: Two simultaneous refund processing requests ---
  try {
    console.log("--- Executing Attack 4: Two simultaneous refund processing requests ---");
    const customer = await createTestCustomer("refundCust1");
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-REF1`,
        customerId: customer.id,
        status: "Delivered",
        paymentStatus: "Paid",
        subtotal: new Prisma.Decimal("100.00"),
        totalAmount: new Prisma.Decimal("100.00"),
      },
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        customerId: customer.id,
        amount: new Prisma.Decimal("100.00"),
        refundedAmount: new Prisma.Decimal("0.00"),
        currency: "USD",
        status: PaymentStatus.PAID,
      },
    });

    const refund = await prisma.refund.create({
      data: {
        paymentId: payment.id,
        orderId: order.id,
        customerId: customer.id,
        amount: new Prisma.Decimal("100.00"),
        status: RefundStatus.PENDING,
      },
    });

    let resA: any = null, resB: any = null;
    let errA: any = null, errB: any = null;

    await Promise.all([
      AdminRefundService.processRefund(refund.id, "COMPLETED").then(r => resA = r).catch(e => errA = e),
      AdminRefundService.processRefund(refund.id, "COMPLETED").then(r => resB = r).catch(e => errB = e),
    ]);

    const finalPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
    const finalRefund = await prisma.refund.findUnique({ where: { id: refund.id } });
    const finalOrder = await prisma.order.findUnique({ where: { id: order.id } });

    results.push({
      scenarioId: 4,
      scenarioName: "Two simultaneous refund processing requests",
      requestAInitialState: { refundId: refund.id, status: "PENDING", refundedAmount: "0.00" },
      requestBInitialState: { refundId: refund.id, status: "PENDING", refundedAmount: "0.00" },
      expectedResult: "Exactly ONE process call succeeds, payment.refundedAmount = 100.00, Payment status = REFUNDED",
      actualResult: `Refunded amount: ${finalPayment?.refundedAmount.toString()}, Refund status: ${finalRefund?.status}, Errors: ${[errA, errB].filter(Boolean).length}`,
      finalDbState: {
        paymentRefundedAmount: finalPayment?.refundedAmount.toString(),
        paymentStatus: finalPayment?.status,
        orderPaymentStatus: finalOrder?.paymentStatus,
        refundStatus: finalRefund?.status,
      },
      doubleMutationOccurred: finalPayment?.refundedAmount.gt(new Prisma.Decimal("100.00")),
      rollbackOccurred: errA !== null || errB !== null,
      verifiedWithRealDb: true,
    });
  } catch (e: any) {
    console.error("Attack 4 error:", e);
  }

  // --- ATTACK 5: Two different partial refunds ---
  try {
    console.log("--- Executing Attack 5: Two different partial refunds ---");
    const customer = await createTestCustomer("partialCust");
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-PART`,
        customerId: customer.id,
        status: "Delivered",
        paymentStatus: "Paid",
        subtotal: new Prisma.Decimal("100.00"),
        totalAmount: new Prisma.Decimal("100.00"),
      },
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        customerId: customer.id,
        amount: new Prisma.Decimal("100.00"),
        refundedAmount: new Prisma.Decimal("0.00"),
        currency: "USD",
        status: PaymentStatus.PAID,
      },
    });

    // Two $70 refunds on a $100 payment (Total = $140 > $100 -> One MUST fail)
    let resA: any = null, resB: any = null;
    let errA: any = null, errB: any = null;

    await Promise.all([
      AdminRefundService.initiateAdminRefund({
        paymentId: payment.id,
        amount: new Prisma.Decimal("70.00"),
        reason: "Partial A",
        autoProcess: true,
      }).then(r => resA = r).catch(e => errA = e),
      AdminRefundService.initiateAdminRefund({
        paymentId: payment.id,
        amount: new Prisma.Decimal("70.00"),
        reason: "Partial B",
        autoProcess: true,
      }).then(r => resB = r).catch(e => errB = e),
    ]);

    const finalPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
    const refunds = await prisma.refund.findMany({ where: { paymentId: payment.id } });

    results.push({
      scenarioId: 5,
      scenarioName: "Two different partial refunds ($70 + $70 on $100 payment)",
      requestAInitialState: { paymentId: payment.id, requested: "70.00", available: "100.00" },
      requestBInitialState: { paymentId: payment.id, requested: "70.00", available: "100.00" },
      expectedResult: "Exactly ONE partial refund succeeds ($70.00), second fails. Payment refundedAmount = 70.00 <= 100.00",
      actualResult: `Refunded amount: ${finalPayment?.refundedAmount.toString()}, Refund count: ${refunds.length}`,
      finalDbState: {
        paymentRefundedAmount: finalPayment?.refundedAmount.toString(),
        paymentStatus: finalPayment?.status,
        refundsCount: refunds.length,
      },
      doubleMutationOccurred: finalPayment?.refundedAmount.gt(new Prisma.Decimal("100.00")),
      rollbackOccurred: errA !== null || errB !== null,
      verifiedWithRealDb: true,
    });
  } catch (e: any) {
    console.error("Attack 5 error:", e);
  }

  // --- ATTACK 6: Refund processing vs refund request ---
  try {
    console.log("--- Executing Attack 6: Refund processing vs refund request ---");
    const customer = await createTestCustomer("refVsReq");
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-REFREQ`,
        customerId: customer.id,
        status: "Delivered",
        paymentStatus: "Paid",
        subtotal: new Prisma.Decimal("100.00"),
        totalAmount: new Prisma.Decimal("100.00"),
      },
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        customerId: customer.id,
        amount: new Prisma.Decimal("100.00"),
        refundedAmount: new Prisma.Decimal("0.00"),
        currency: "USD",
        status: PaymentStatus.PAID,
      },
    });

    // Existing pending refund for $60.00
    const existingRefund = await prisma.refund.create({
      data: {
        paymentId: payment.id,
        orderId: order.id,
        customerId: customer.id,
        amount: new Prisma.Decimal("60.00"),
        status: RefundStatus.PENDING,
      },
    });

    let resProc: any = null, resNew: any = null;
    let errProc: any = null, errNew: any = null;

    // Simultaneous: Process $60 pending refund vs Initiate new $60 refund (60 + 60 = 120 > 100)
    await Promise.all([
      AdminRefundService.processRefund(existingRefund.id, "COMPLETED").then(r => resProc = r).catch(e => errProc = e),
      AdminRefundService.initiateAdminRefund({
        paymentId: payment.id,
        amount: new Prisma.Decimal("60.00"),
        reason: "New refund attempt",
        autoProcess: true,
      }).then(r => resNew = r).catch(e => errNew = e),
    ]);

    const finalPayment = await prisma.payment.findUnique({ where: { id: payment.id } });

    results.push({
      scenarioId: 6,
      scenarioName: "Refund processing vs refund request",
      requestAInitialState: { existingPendingRefund: "60.00", paymentAmount: "100.00" },
      requestBInitialState: { newRefundRequest: "60.00", paymentAmount: "100.00" },
      expectedResult: "Total refunded amount strictly <= 100.00. Either processing succeeds and new request is blocked or vice-versa.",
      actualResult: `Final refunded amount: ${finalPayment?.refundedAmount.toString()}`,
      finalDbState: { paymentRefundedAmount: finalPayment?.refundedAmount.toString(), paymentStatus: finalPayment?.status },
      doubleMutationOccurred: finalPayment?.refundedAmount.gt(new Prisma.Decimal("100.00")),
      rollbackOccurred: errProc !== null || errNew !== null,
      verifiedWithRealDb: true,
    });
  } catch (e: any) {
    console.error("Attack 6 error:", e);
  }

  // --- ATTACK 7: Two simultaneous return RECEIVE requests ---
  try {
    console.log("--- Executing Attack 7: Two simultaneous return RECEIVE requests ---");
    const warehouse = await createTestWarehouse();
    const { product, inventory } = await createTestProductWithInventory(warehouse.id, 10);
    const customer = await createTestCustomer("returnRec");

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-RETREC`,
        customerId: customer.id,
        status: "Delivered",
        paymentStatus: "Paid",
        subtotal: new Prisma.Decimal("100.00"),
        totalAmount: new Prisma.Decimal("100.00"),
        items: {
          create: [{ productId: product.id, warehouseId: warehouse.id, quantity: 2, unitPrice: new Prisma.Decimal("50.00"), totalAmount: new Prisma.Decimal("100.00") }],
        },
      },
      include: { items: true },
    });

    const returnReq = await prisma.returnRequest.create({
      data: {
        orderId: order.id,
        customerId: customer.id,
        reason: "Defective",
        status: ReturnStatus.APPROVED,
        items: {
          create: [{ orderItemId: order.items[0].id, warehouseId: warehouse.id, quantity: 2 }],
        },
      },
    });

    const initStock = inventory.quantityAvailable; // 10

    let errA: any = null, errB: any = null;

    await Promise.all([
      AdminReturnService.receiveReturn(returnReq.id, "Receive A").catch(e => errA = e),
      AdminReturnService.receiveReturn(returnReq.id, "Receive B").catch(e => errB = e),
    ]);

    const finalReturnReq = await prisma.returnRequest.findUnique({ where: { id: returnReq.id } });
    const finalInv = await prisma.inventory.findUnique({ where: { id: inventory.id } });

    const stockDelta = (finalInv?.quantityAvailable ?? 0) - initStock;

    results.push({
      scenarioId: 7,
      scenarioName: "Two simultaneous return RECEIVE requests",
      requestAInitialState: { returnStatus: "APPROVED", stock: 10 },
      requestBInitialState: { returnStatus: "APPROVED", stock: 10 },
      expectedResult: "Return status = RECEIVED, stock restored EXACTLY ONCE (+2 -> 12)",
      actualResult: `Return status: ${finalReturnReq?.status}, Stock delta: +${stockDelta}`,
      finalDbState: { returnStatus: finalReturnReq?.status, inventoryQuantity: finalInv?.quantityAvailable },
      doubleMutationOccurred: stockDelta !== 2,
      rollbackOccurred: errA !== null || errB !== null,
      verifiedWithRealDb: true,
    });
  } catch (e: any) {
    console.error("Attack 7 error:", e);
  }

  // --- ATTACK 8: Two simultaneous return requests for same order item ---
  try {
    console.log("--- Executing Attack 8: Two simultaneous return requests for same order item ---");
    const warehouse = await createTestWarehouse();
    const { product } = await createTestProductWithInventory(warehouse.id, 10);
    const customer = await createTestCustomer("returnSameItem");

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-RETSAME`,
        customerId: customer.id,
        status: "Delivered",
        paymentStatus: "Paid",
        subtotal: new Prisma.Decimal("100.00"),
        totalAmount: new Prisma.Decimal("100.00"),
        items: {
          create: [{ productId: product.id, warehouseId: warehouse.id, quantity: 2, unitPrice: new Prisma.Decimal("50.00"), totalAmount: new Prisma.Decimal("100.00") }],
        },
      },
      include: { items: true },
    });

    const orderItemId = order.items[0].id; // 2 purchased

    let errA: any = null, errB: any = null;

    // Simultaneous return requests for 2 units each (2 + 2 = 4 > 2)
    await Promise.all([
      StorefrontReturnService.requestReturn(customer.id, order.id, "Return request A", [
        { orderItemId, quantity: 2 },
      ]).catch(e => errA = e),
      StorefrontReturnService.requestReturn(customer.id, order.id, "Return request B", [
        { orderItemId, quantity: 2 },
      ]).catch(e => errB = e),
    ]);

    const returnRequests = await prisma.returnRequest.findMany({
      where: { orderId: order.id },
      include: { items: true },
    });

    const totalRequestedQty = returnRequests.reduce((sum, r) => sum + r.items.reduce((iSum, item) => iSum + item.quantity, 0), 0);

    results.push({
      scenarioId: 8,
      scenarioName: "Two simultaneous return requests for same order item (2 + 2 on 2 purchased)",
      requestAInitialState: { requestedQty: 2, purchasedQty: 2 },
      requestBInitialState: { requestedQty: 2, purchasedQty: 2 },
      expectedResult: "Exactly ONE return request succeeds (2 units), second rejected. Total requested return <= 2",
      actualResult: `Created return requests: ${returnRequests.length}, Total return qty: ${totalRequestedQty}`,
      finalDbState: { returnRequestsCount: returnRequests.length, totalRequestedQty },
      doubleMutationOccurred: totalRequestedQty > 2,
      rollbackOccurred: errA !== null || errB !== null,
      verifiedWithRealDb: true,
    });
  } catch (e: any) {
    console.error("Attack 8 error:", e);
  }

  // --- ATTACK 9: Payment webhook vs cancellation ---
  try {
    console.log("--- Executing Attack 9: Payment webhook vs cancellation ---");
    const warehouse = await createTestWarehouse();
    const { product } = await createTestProductWithInventory(warehouse.id, 10);
    const customer = await createTestCustomer("webVsCancel");

    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-WEBCANCEL`,
        customerId: customer.id,
        status: "Processing",
        paymentStatus: "Pending",
        subtotal: new Prisma.Decimal("100.00"),
        totalAmount: new Prisma.Decimal("100.00"),
        items: {
          create: [{ productId: product.id, warehouseId: warehouse.id, quantity: 1, unitPrice: new Prisma.Decimal("100.00"), totalAmount: new Prisma.Decimal("100.00") }],
        },
      },
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        customerId: customer.id,
        amount: new Prisma.Decimal("100.00"),
        refundedAmount: new Prisma.Decimal("0.00"),
        currency: "USD",
        status: PaymentStatus.PENDING,
      },
    });

    // Webhook setup
    const secret = "whsec_test_secret";
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    const payload = JSON.stringify({
      id: `evt_test_${Date.now()}`,
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: `pi_test_${Date.now()}`,
          metadata: { orderId: order.id, paymentId: payment.id },
          amount: 10000,
          currency: "usd",
          status: "succeeded",
        },
      },
    });

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
    const stripeHeader = `t=${timestamp},v1=${signature}`;

    let errCancel: any = null, errWeb: any = null;

    await Promise.all([
      callUpdateOrderStatus(order.id, "Cancelled", "Cancel request").catch(e => errCancel = e),
      PaymentSecurityService.verifyAndProcessWebhook("stripe", payload, { "stripe-signature": stripeHeader }).catch(e => errWeb = e),
    ]);

    const finalOrder = await prisma.order.findUnique({ where: { id: order.id } });
    const finalPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
    const refunds = await prisma.refund.findMany({ where: { orderId: order.id } });

    // Invariant 15: Late payment webhook cannot resurrect a cancelled order. If cancelled, order status MUST remain Cancelled.
    const orderResurrected = finalOrder?.status !== "Cancelled" && errCancel === null;

    results.push({
      scenarioId: 9,
      scenarioName: "Payment webhook vs cancellation",
      requestAInitialState: { action: "Cancel Order", status: "Processing" },
      requestBInitialState: { action: "Process Webhook", paymentStatus: "PENDING" },
      expectedResult: "If order is cancelled, late payment webhook MUST NOT resurrect order status to Processing/Confirmed, funds staged into auto-refund",
      actualResult: `Final Order Status: ${finalOrder?.status}, Final Payment Status: ${finalPayment?.status}, Refunds staged: ${refunds.length}`,
      finalDbState: {
        orderStatus: finalOrder?.status,
        paymentStatus: finalPayment?.status,
        stagedRefundsCount: refunds.length,
      },
      doubleMutationOccurred: orderResurrected,
      rollbackOccurred: errCancel !== null || errWeb !== null,
      verifiedWithRealDb: true,
    });
  } catch (e: any) {
    console.error("Attack 9 error:", e);
  }

  // --- ATTACK 10: Duplicate payment webhook ---
  try {
    console.log("--- Executing Attack 10: Duplicate payment webhook ---");
    const customer = await createTestCustomer("dupWeb");
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-DUPWEB`,
        customerId: customer.id,
        status: "Processing",
        paymentStatus: "Pending",
        subtotal: new Prisma.Decimal("100.00"),
        totalAmount: new Prisma.Decimal("100.00"),
      },
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        customerId: customer.id,
        amount: new Prisma.Decimal("100.00"),
        refundedAmount: new Prisma.Decimal("0.00"),
        currency: "USD",
        status: PaymentStatus.PENDING,
      },
    });

    const secret = "whsec_test_secret";
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    const payload = JSON.stringify({
      id: `evt_dup_${Date.now()}`,
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: `pi_dup_${Date.now()}`,
          metadata: { orderId: order.id, paymentId: payment.id },
          amount: 10000,
          currency: "usd",
          status: "succeeded",
        },
      },
    });

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
    const stripeHeader = `t=${timestamp},v1=${signature}`;

    let res1: any = null, res2: any = null;

    await Promise.all([
      PaymentSecurityService.verifyAndProcessWebhook("stripe", payload, { "stripe-signature": stripeHeader }).then(r => res1 = r),
      PaymentSecurityService.verifyAndProcessWebhook("stripe", payload, { "stripe-signature": stripeHeader }).then(r => res2 = r),
    ]);

    const txs = await prisma.paymentTransaction.findMany({ where: { paymentId: payment.id } });
    const logs = await prisma.orderActivityLog.findMany({ where: { orderId: order.id, action: "PAYMENT_SUCCESS" } });

    results.push({
      scenarioId: 10,
      scenarioName: "Duplicate payment webhook (2 simultaneous webhooks with same signature/event)",
      requestAInitialState: { paymentStatus: "PENDING" },
      requestBInitialState: { paymentStatus: "PENDING" },
      expectedResult: "Exactly ONE webhook completes payment mutation, second returns ALREADY_PROCESSED. Payment status = PAID",
      actualResult: `Payment transactions created: ${txs.length}, Activity logs created: ${logs.length}`,
      finalDbState: { transactionsCount: txs.length, activityLogsCount: logs.length },
      doubleMutationOccurred: txs.length > 1,
      rollbackOccurred: false,
      verifiedWithRealDb: true,
    });
  } catch (e: any) {
    console.error("Attack 10 error:", e);
  }

  // --- ATTACK 11: Payment success vs refund ---
  try {
    console.log("--- Executing Attack 11: Payment success vs refund ---");
    const customer = await createTestCustomer("payVsRef");
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-PAYREF`,
        customerId: customer.id,
        status: "Processing",
        paymentStatus: "Pending",
        subtotal: new Prisma.Decimal("100.00"),
        totalAmount: new Prisma.Decimal("100.00"),
      },
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        customerId: customer.id,
        amount: new Prisma.Decimal("100.00"),
        refundedAmount: new Prisma.Decimal("0.00"),
        currency: "USD",
        status: PaymentStatus.PENDING,
      },
    });

    let errPay: any = null, errRef: any = null;

    // Webhook success vs Admin refund attempt on PENDING payment
    const secret = "whsec_test_secret";
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    const payload = JSON.stringify({
      id: `evt_payref_${Date.now()}`,
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: `pi_payref_${Date.now()}`,
          metadata: { orderId: order.id, paymentId: payment.id },
          amount: 10000,
          currency: "usd",
          status: "succeeded",
        },
      },
    });

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
    const stripeHeader = `t=${timestamp},v1=${signature}`;

    await Promise.all([
      PaymentSecurityService.verifyAndProcessWebhook("stripe", payload, { "stripe-signature": stripeHeader }).catch(e => errPay = e),
      AdminRefundService.initiateAdminRefund({
        paymentId: payment.id,
        amount: new Prisma.Decimal("100.00"),
        reason: "Refund on pending payment",
        autoProcess: true,
      }).catch(e => errRef = e),
    ]);

    const finalPayment = await prisma.payment.findUnique({ where: { id: payment.id } });

    results.push({
      scenarioId: 11,
      scenarioName: "Payment success vs refund",
      requestAInitialState: { action: "Process Webhook", paymentStatus: "PENDING" },
      requestBInitialState: { action: "Initiate Refund", paymentStatus: "PENDING" },
      expectedResult: "Payment refundedAmount <= 100.00. Either refund fails due to pending payment OR webhook completes payment first then refund processes.",
      actualResult: `Final Payment Status: ${finalPayment?.status}, Refunded Amount: ${finalPayment?.refundedAmount.toString()}`,
      finalDbState: { paymentStatus: finalPayment?.status, refundedAmount: finalPayment?.refundedAmount.toString() },
      doubleMutationOccurred: finalPayment?.refundedAmount.gt(new Prisma.Decimal("100.00")),
      rollbackOccurred: errPay !== null || errRef !== null,
      verifiedWithRealDb: true,
    });
  } catch (e: any) {
    console.error("Attack 11 error:", e);
  }

  // --- ATTACK 12: Cancellation vs refund ---
  try {
    console.log("--- Executing Attack 12: Cancellation vs refund ---");
    const customer = await createTestCustomer("cancelVsRefund");
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-CANREF`,
        customerId: customer.id,
        status: "Processing",
        paymentStatus: "Paid",
        subtotal: new Prisma.Decimal("100.00"),
        totalAmount: new Prisma.Decimal("100.00"),
      },
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        customerId: customer.id,
        amount: new Prisma.Decimal("100.00"),
        refundedAmount: new Prisma.Decimal("0.00"),
        currency: "USD",
        status: PaymentStatus.PAID,
      },
    });

    let errCancel: any = null, errRefund: any = null;

    // Simultaneous: Order Cancellation (creates PENDING auto-refund) vs Direct Admin Refund ($100)
    await Promise.all([
      callUpdateOrderStatus(order.id, "Cancelled", "Cancel request").catch(e => errCancel = e),
      AdminRefundService.initiateAdminRefund({
        paymentId: payment.id,
        amount: new Prisma.Decimal("100.00"),
        reason: "Manual refund",
        autoProcess: true,
      }).catch(e => errRefund = e),
    ]);

    const finalPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
    const refunds = await prisma.refund.findMany({ where: { paymentId: payment.id } });

    const totalRefundsAmount = refunds.reduce((sum, r) => sum.add(r.amount), new Prisma.Decimal("0.00"));

    results.push({
      scenarioId: 12,
      scenarioName: "Cancellation vs refund (100 auto-refund vs 100 manual refund on 100 payment)",
      requestAInitialState: { action: "Cancel Order", paymentAmount: "100.00" },
      requestBInitialState: { action: "Manual Refund", paymentAmount: "100.00" },
      expectedResult: "Total refunds created/processed strictly <= 100.00. No double refund.",
      actualResult: `Refunds count: ${refunds.length}, Total refund amount: ${totalRefundsAmount.toString()}, Payment refundedAmount: ${finalPayment?.refundedAmount.toString()}`,
      finalDbState: {
        paymentRefundedAmount: finalPayment?.refundedAmount.toString(),
        refundsCount: refunds.length,
        totalRefundsAmount: totalRefundsAmount.toString(),
      },
      doubleMutationOccurred: finalPayment?.refundedAmount.gt(new Prisma.Decimal("100.00")) || totalRefundsAmount.gt(new Prisma.Decimal("100.00")),
      rollbackOccurred: errCancel !== null || errRefund !== null,
      verifiedWithRealDb: true,
    });
  } catch (e: any) {
    console.error("Attack 12 error:", e);
  }

  console.log("\n=========================================================");
  console.log("RED-TEAM CONCURRENCY AUDIT RESULTS SUMMARY");
  console.log("=========================================================");

  for (const r of results) {
    console.log(`\nScenario ${r.scenarioId}: ${r.scenarioName}`);
    console.log(`- Request A initial state: ${JSON.stringify(r.requestAInitialState)}`);
    console.log(`- Request B initial state: ${JSON.stringify(r.requestBInitialState)}`);
    console.log(`- Expected result: ${r.expectedResult}`);
    console.log(`- Actual result: ${r.actualResult}`);
    console.log(`- Final DB state: ${JSON.stringify(r.finalDbState)}`);
    console.log(`- Double mutation occurred: ${r.doubleMutationOccurred ? "YES ❌" : "NO ✅"}`);
    console.log(`- Rollback occurred: ${r.rollbackOccurred ? "YES (handled)" : "NO"}`);
    console.log(`- Verified with real DB: ${r.verifiedWithRealDb ? "YES ✅" : "NO ❌"}`);
  }

  process.exit(0);
}

runRedTeamConcurrencyAudit();
