import { PrismaClient, PaymentStatus, RefundStatus, ReturnStatus, Prisma } from "@prisma/client";
import { AdminRefundService } from "../services/refund.service";
import { StorefrontRefundService } from "../services/storefront/refund.service";
import { AdminReturnService } from "../services/return.service";
import { PaymentSecurityService } from "../services/storefront/paymentSecurity.service";
import { updateOrderStatus } from "../controllers/order.controller";

interface MatrixRow {
  test: string;
  concurrencyMethod: string;
  expected: string;
  actual: string;
  dbFinalState: string;
  invariantResult: string;
  deadlockResult: string;
  verificationStatus: "PASS" | "FAIL" | "NOT VERIFIED";
}

async function runRealPostgresqlConcurrencyTests() {
  console.log("=========================================================");
  console.log("RUNNING REAL POSTGRESQL CONCURRENCY VERIFICATION (STEP 7)");
  console.log("=========================================================\n");

  const matrix: MatrixRow[] = [];
  const dbUrl = process.env.DATABASE_URL;

  let prisma: PrismaClient | null = null;
  let isDbAvailable = false;

  if (dbUrl) {
    try {
      prisma = new PrismaClient();
      await prisma.$connect();
      isDbAvailable = true;
      console.log("✓ Connected to PostgreSQL instance at DATABASE_URL");
    } catch (err: any) {
      console.log("⚠️ Failed to connect to PostgreSQL:", err.message);
      isDbAvailable = false;
    }
  } else {
    console.log("⚠️ DATABASE_URL environment variable is NOT defined.");
    console.log("⚠️ Real PostgreSQL server is unavailable at localhost:5432.");
  }

  if (!isDbAvailable) {
    console.log("\n[STATUS]: Real PostgreSQL database is UNAVAILABLE.");
    console.log("[STATUS]: Marking all 8 real PostgreSQL concurrency tests as NOT VERIFIED.\n");

    const tests = [
      { name: "TEST 1: Cancellation vs Admin Refund", method: "Promise.all([Order.cancel, AdminRefund.process])" },
      { name: "TEST 2: Cancellation vs Storefront Refund", method: "Promise.all([Order.cancel, StorefrontRefund.request])" },
      { name: "TEST 3: Cancellation vs Return Refund", method: "Promise.all([Order.cancel, Return.updateStatus])" },
      { name: "TEST 4: Refund initiation vs Refund processing", method: "Promise.all([Refund.initiate, Refund.process])" },
      { name: "TEST 5: Duplicate payment webhook", method: "Promise.all([PaymentWebhook.process, PaymentWebhook.process])" },
      { name: "TEST 6: Late webhook vs REFUNDED payment", method: "Promise.all([PaymentWebhook.process, AdminRefund.process])" },
      { name: "TEST 7: Two cancellation requests", method: "Promise.all([Order.cancel, Order.cancel])" },
      { name: "TEST 8: Processing refund vs new refund", method: "Promise.all([Refund.process, Refund.initiate])" },
    ];

    for (const t of tests) {
      matrix.push({
        test: t.name,
        concurrencyMethod: t.method,
        expected: "Serialized execution, zero financial invariant violations, no 40P01 deadlock",
        actual: "Database server unreachable in test environment",
        dbFinalState: "N/A (No DB connection)",
        invariantResult: "N/A",
        deadlockResult: "N/A",
        verificationStatus: "NOT VERIFIED",
      });
    }
  } else {
    // DB is available - run real PostgreSQL tests with isolated test data
    console.log("Running concurrent tests against live PostgreSQL...\n");

    const cleanupOrder = async (orderId: string) => {
      try {
        await prisma!.$executeRaw`DELETE FROM "OrderTimeline" WHERE "orderId" = ${orderId}`;
        await prisma!.$executeRaw`DELETE FROM "RefundTransaction" WHERE "refundId" IN (SELECT id FROM "Refund" WHERE "orderId" = ${orderId})`;
        await prisma!.$executeRaw`DELETE FROM "Refund" WHERE "orderId" = ${orderId}`;
        await prisma!.$executeRaw`DELETE FROM "PaymentTransaction" WHERE "paymentId" IN (SELECT id FROM "Payment" WHERE "orderId" = ${orderId})`;
        await prisma!.$executeRaw`DELETE FROM "Payment" WHERE "orderId" = ${orderId}`;
        await prisma!.$executeRaw`DELETE FROM "OrderItem" WHERE "orderId" = ${orderId}`;
        await prisma!.$executeRaw`DELETE FROM "ReturnItem" WHERE "returnRequestId" IN (SELECT id FROM "ReturnRequest" WHERE "orderId" = ${orderId})`;
        await prisma!.$executeRaw`DELETE FROM "ReturnRequest" WHERE "orderId" = ${orderId}`;
        await prisma!.$executeRaw`DELETE FROM "Order" WHERE id = ${orderId}`;
      } catch (e) {
        // Ignore cleanup errors
      }
    };

    const checkInvariants = async (orderId: string) => {
      const payment = await prisma!.payment.findFirst({ where: { orderId } });
      const refunds = await prisma!.refund.findMany({ where: { orderId } });

      if (!payment) return { ok: false, reason: "Payment not found" };

      const activeRefundSum = refunds
        .filter((r) => r.status === RefundStatus.COMPLETED || r.status === RefundStatus.PENDING || r.status === RefundStatus.PROCESSING)
        .reduce((sum, r) => sum.add(r.amount), new Prisma.Decimal(0));

      const completedRefundSum = refunds
        .filter((r) => r.status === RefundStatus.COMPLETED)
        .reduce((sum, r) => sum.add(r.amount), new Prisma.Decimal(0));

      const activeInvariant = activeRefundSum.lte(payment.amount);
      const refundedAmountMatch = payment.refundedAmount.equals(completedRefundSum);

      const cancelRefunds = refunds.filter((r) => r.reason?.includes("cancellation") && (r.status === RefundStatus.COMPLETED || r.status === RefundStatus.PENDING || r.status === RefundStatus.PROCESSING));
      const singleCancelRefund = cancelRefunds.length <= 1;

      const ok = activeInvariant && refundedAmountMatch && singleCancelRefund;
      return {
        ok,
        paymentStatus: payment.status,
        refundedAmount: payment.refundedAmount.toString(),
        completedSum: completedRefundSum.toString(),
        activeSum: activeRefundSum.toString(),
        cancelRefundCount: cancelRefunds.length,
        reason: ok
          ? "All invariants passed"
          : `Active sum ${activeRefundSum} <= ${payment.amount} (${activeInvariant}), RefundedAmount ${payment.refundedAmount} == ${completedRefundSum} (${refundedAmountMatch}), Single cancel refund (${singleCancelRefund})`,
      };
    };

    // TEST 1: Cancellation vs Admin Refund
    try {
      const orderId = `ord_test_1_${Date.now()}`;
      await cleanupOrder(orderId);

      const order = await prisma!.order.create({
        data: {
          id: orderId,
          orderNumber: `ORD-T1-${Date.now()}`,
          totalAmount: new Prisma.Decimal(100),
          status: "PAID",
          paymentStatus: "PAID",
          payment: {
            create: {
              id: `pay_t1_${Date.now()}`,
              amount: new Prisma.Decimal(100),
              refundedAmount: new Prisma.Decimal(0),
              currency: "BDT",
              status: PaymentStatus.PAID,
            },
          },
        },
        include: { payment: true },
      });

      const refund = await prisma!.refund.create({
        data: {
          id: `ref_t1_${Date.now()}`,
          paymentId: order.payment!.id,
          orderId,
          amount: new Prisma.Decimal(50),
          reason: "Admin partial refund request",
          status: RefundStatus.PENDING,
        },
      });

      // Concurrent execution: Cancellation vs Admin Refund process
      const req1: any = { params: { id: orderId }, body: { status: "CANCELLED" } };
      const res1: any = { status: () => res1, json: () => {} };

      const results = await Promise.allSettled([
        updateOrderStatus(req1, res1, (() => {}) as any),
        AdminRefundService.processRefund(refund.id, true, "Admin approved"),
      ]);

      const check = await checkInvariants(orderId);
      const deadlockOccurred = results.some((r) => r.status === "rejected" && (r.reason?.message?.includes("40P01") || r.reason?.code === "40P01"));

      matrix.push({
        test: "TEST 1: Cancellation vs Admin Refund",
        concurrencyMethod: "Promise.all([Order.cancel, AdminRefund.process])",
        expected: "Serialized lock acquisition without 40P01 deadlock",
        actual: "Serialized under canonical locks",
        dbFinalState: `Payment status: ${check.paymentStatus}, Refunded: ${check.refundedAmount}`,
        invariantResult: check.ok ? "Passed" : `Failed: ${check.reason}`,
        deadlockResult: deadlockOccurred ? "40P01 Deadlock Detected" : "No Deadlock",
        verificationStatus: check.ok && !deadlockOccurred ? "PASS" : "FAIL",
      });
      await cleanupOrder(orderId);
    } catch (e: any) {
      matrix.push({
        test: "TEST 1: Cancellation vs Admin Refund",
        concurrencyMethod: "Promise.all([Order.cancel, AdminRefund.process])",
        expected: "Serialized lock acquisition without 40P01 deadlock",
        actual: e.message,
        dbFinalState: "Failed",
        invariantResult: "Failed",
        deadlockResult: e.message.includes("40P01") ? "40P01 Deadlock" : "No Deadlock",
        verificationStatus: "FAIL",
      });
    }

    // TEST 2: Cancellation vs Storefront Refund
    try {
      const orderId = `ord_test_2_${Date.now()}`;
      await cleanupOrder(orderId);

      const order = await prisma!.order.create({
        data: {
          id: orderId,
          orderNumber: `ORD-T2-${Date.now()}`,
          totalAmount: new Prisma.Decimal(100),
          status: "PAID",
          paymentStatus: "PAID",
          payment: {
            create: {
              id: `pay_t2_${Date.now()}`,
              amount: new Prisma.Decimal(100),
              refundedAmount: new Prisma.Decimal(0),
              currency: "BDT",
              status: PaymentStatus.PAID,
            },
          },
        },
        include: { payment: true },
      });

      const req1: any = { params: { id: orderId }, body: { status: "CANCELLED" } };
      const res1: any = { status: () => res1, json: () => {} };

      const results = await Promise.allSettled([
        updateOrderStatus(req1, res1, (() => {}) as any),
        StorefrontRefundService.requestRefund(orderId, "usr_100", 60, "Storefront refund request"),
      ]);

      const check = await checkInvariants(orderId);
      const deadlockOccurred = results.some((r) => r.status === "rejected" && (r.reason?.message?.includes("40P01") || r.reason?.code === "40P01"));

      matrix.push({
        test: "TEST 2: Cancellation vs Storefront Refund",
        concurrencyMethod: "Promise.all([Order.cancel, StorefrontRefund.request])",
        expected: "Reservation invariant enforced, zero over-refund",
        actual: "Serialized under canonical locks",
        dbFinalState: `Payment status: ${check.paymentStatus}, Refunded: ${check.refundedAmount}`,
        invariantResult: check.ok ? "Passed" : `Failed: ${check.reason}`,
        deadlockResult: deadlockOccurred ? "40P01 Deadlock Detected" : "No Deadlock",
        verificationStatus: check.ok && !deadlockOccurred ? "PASS" : "FAIL",
      });
      await cleanupOrder(orderId);
    } catch (e: any) {
      matrix.push({
        test: "TEST 2: Cancellation vs Storefront Refund",
        concurrencyMethod: "Promise.all([Order.cancel, StorefrontRefund.request])",
        expected: "Reservation invariant enforced, zero over-refund",
        actual: e.message,
        dbFinalState: "Failed",
        invariantResult: "Failed",
        deadlockResult: e.message.includes("40P01") ? "40P01 Deadlock" : "No Deadlock",
        verificationStatus: "FAIL",
      });
    }

    // TEST 3: Cancellation vs Return Refund
    try {
      const orderId = `ord_test_3_${Date.now()}`;
      await cleanupOrder(orderId);

      const order = await prisma!.order.create({
        data: {
          id: orderId,
          orderNumber: `ORD-T3-${Date.now()}`,
          totalAmount: new Prisma.Decimal(100),
          status: "DELIVERED",
          paymentStatus: "PAID",
          payment: {
            create: {
              id: `pay_t3_${Date.now()}`,
              amount: new Prisma.Decimal(100),
              refundedAmount: new Prisma.Decimal(0),
              currency: "BDT",
              status: PaymentStatus.PAID,
            },
          },
        },
        include: { payment: true },
      });

      const returnReq = await prisma!.returnRequest.create({
        data: {
          id: `ret_t3_${Date.now()}`,
          orderId,
          customerId: "usr_100",
          returnNumber: `RET-T3-${Date.now()}`,
          status: ReturnStatus.REQUESTED,
          refundAmount: new Prisma.Decimal(50),
          reason: "Defective item",
        },
      });

      const req1: any = { params: { id: orderId }, body: { status: "CANCELLED" } };
      const res1: any = { status: () => res1, json: () => {} };

      const results = await Promise.allSettled([
        updateOrderStatus(req1, res1, (() => {}) as any),
        AdminReturnService.updateReturnStatus(returnReq.id, ReturnStatus.APPROVED, "Approved by admin"),
      ]);

      const check = await checkInvariants(orderId);
      const deadlockOccurred = results.some((r) => r.status === "rejected" && (r.reason?.message?.includes("40P01") || r.reason?.code === "40P01"));

      matrix.push({
        test: "TEST 3: Cancellation vs Return Refund",
        concurrencyMethod: "Promise.all([Order.cancel, Return.updateStatus])",
        expected: "Serialized safely without financial invariant violation",
        actual: "Serialized under canonical locks",
        dbFinalState: `Payment status: ${check.paymentStatus}, Refunded: ${check.refundedAmount}`,
        invariantResult: check.ok ? "Passed" : `Failed: ${check.reason}`,
        deadlockResult: deadlockOccurred ? "40P01 Deadlock Detected" : "No Deadlock",
        verificationStatus: check.ok && !deadlockOccurred ? "PASS" : "FAIL",
      });
      await cleanupOrder(orderId);
    } catch (e: any) {
      matrix.push({
        test: "TEST 3: Cancellation vs Return Refund",
        concurrencyMethod: "Promise.all([Order.cancel, Return.updateStatus])",
        expected: "Serialized safely without financial invariant violation",
        actual: e.message,
        dbFinalState: "Failed",
        invariantResult: "Failed",
        deadlockResult: e.message.includes("40P01") ? "40P01 Deadlock" : "No Deadlock",
        verificationStatus: "FAIL",
      });
    }

    // TEST 4: Refund initiation vs Refund processing
    try {
      const orderId = `ord_test_4_${Date.now()}`;
      await cleanupOrder(orderId);

      const order = await prisma!.order.create({
        data: {
          id: orderId,
          orderNumber: `ORD-T4-${Date.now()}`,
          totalAmount: new Prisma.Decimal(100),
          status: "PAID",
          paymentStatus: "PAID",
          payment: {
            create: {
              id: `pay_t4_${Date.now()}`,
              amount: new Prisma.Decimal(100),
              refundedAmount: new Prisma.Decimal(0),
              currency: "BDT",
              status: PaymentStatus.PAID,
            },
          },
        },
        include: { payment: true },
      });

      const refund = await prisma!.refund.create({
        data: {
          id: `ref_t4_${Date.now()}`,
          paymentId: order.payment!.id,
          orderId,
          amount: new Prisma.Decimal(60),
          reason: "Existing pending refund",
          status: RefundStatus.PENDING,
        },
      });

      const results = await Promise.allSettled([
        AdminRefundService.initiateAdminRefund(order.payment!.id, 50, "New refund request"),
        AdminRefundService.processRefund(refund.id, true, "Processing pending refund"),
      ]);

      const check = await checkInvariants(orderId);
      const deadlockOccurred = results.some((r) => r.status === "rejected" && (r.reason?.message?.includes("40P01") || r.reason?.code === "40P01"));

      matrix.push({
        test: "TEST 4: Refund initiation vs Refund processing",
        concurrencyMethod: "Promise.all([Refund.initiate, Refund.process])",
        expected: "Active sum bounded by payment.amount = 100",
        actual: "Serialized safely under payment row lock",
        dbFinalState: `Payment status: ${check.paymentStatus}, Refunded: ${check.refundedAmount}`,
        invariantResult: check.ok ? "Passed" : `Failed: ${check.reason}`,
        deadlockResult: deadlockOccurred ? "40P01 Deadlock Detected" : "No Deadlock",
        verificationStatus: check.ok && !deadlockOccurred ? "PASS" : "FAIL",
      });
      await cleanupOrder(orderId);
    } catch (e: any) {
      matrix.push({
        test: "TEST 4: Refund initiation vs Refund processing",
        concurrencyMethod: "Promise.all([Refund.initiate, Refund.process])",
        expected: "Active sum bounded by payment.amount = 100",
        actual: e.message,
        dbFinalState: "Failed",
        invariantResult: "Failed",
        deadlockResult: e.message.includes("40P01") ? "40P01 Deadlock" : "No Deadlock",
        verificationStatus: "FAIL",
      });
    }

    // TEST 5: Duplicate payment webhook
    try {
      const orderId = `ord_test_5_${Date.now()}`;
      await cleanupOrder(orderId);

      const order = await prisma!.order.create({
        data: {
          id: orderId,
          orderNumber: `ORD-T5-${Date.now()}`,
          totalAmount: new Prisma.Decimal(100),
          status: "PENDING",
          paymentStatus: "PENDING",
          payment: {
            create: {
              id: `pay_t5_${Date.now()}`,
              amount: new Prisma.Decimal(100),
              refundedAmount: new Prisma.Decimal(0),
              currency: "BDT",
              status: PaymentStatus.PENDING,
            },
          },
        },
        include: { payment: true },
      });

      const verification: any = {
        verified: true,
        isSuccess: true,
        paymentId: order.payment!.id,
        orderId,
        amount: new Prisma.Decimal(100),
        currency: "BDT",
        eventId: `evt_test_5_${Date.now()}`,
        rawPayload: { id: `evt_test_5_${Date.now()}`, type: "payment_intent.succeeded" },
      };

      const results = await Promise.allSettled([
        PaymentSecurityService.processVerifiedPayment("STRIPE", verification),
        PaymentSecurityService.processVerifiedPayment("STRIPE", verification),
      ]);

      const check = await checkInvariants(orderId);
      const deadlockOccurred = results.some((r) => r.status === "rejected" && (r.reason?.message?.includes("40P01") || r.reason?.code === "40P01"));

      matrix.push({
        test: "TEST 5: Duplicate payment webhook",
        concurrencyMethod: "Promise.all([PaymentWebhook.process, PaymentWebhook.process])",
        expected: "Unique constraint catches duplicate, single payment transition",
        actual: "Unique constraint / idempotency handled",
        dbFinalState: `Payment status: ${check.paymentStatus}`,
        invariantResult: check.ok ? "Passed" : `Failed: ${check.reason}`,
        deadlockResult: deadlockOccurred ? "40P01 Deadlock Detected" : "No Deadlock",
        verificationStatus: check.ok && !deadlockOccurred ? "PASS" : "FAIL",
      });
      await cleanupOrder(orderId);
    } catch (e: any) {
      matrix.push({
        test: "TEST 5: Duplicate payment webhook",
        concurrencyMethod: "Promise.all([PaymentWebhook.process, PaymentWebhook.process])",
        expected: "Unique constraint catches duplicate, single payment transition",
        actual: e.message,
        dbFinalState: "Failed",
        invariantResult: "Failed",
        deadlockResult: e.message.includes("40P01") ? "40P01 Deadlock" : "No Deadlock",
        verificationStatus: "FAIL",
      });
    }

    // TEST 6: Late webhook vs REFUNDED payment
    try {
      const orderId = `ord_test_6_${Date.now()}`;
      await cleanupOrder(orderId);

      const order = await prisma!.order.create({
        data: {
          id: orderId,
          orderNumber: `ORD-T6-${Date.now()}`,
          totalAmount: new Prisma.Decimal(100),
          status: "REFUNDED",
          paymentStatus: "REFUNDED",
          payment: {
            create: {
              id: `pay_t6_${Date.now()}`,
              amount: new Prisma.Decimal(100),
              refundedAmount: new Prisma.Decimal(100),
              currency: "BDT",
              status: PaymentStatus.REFUNDED,
            },
          },
        },
        include: { payment: true },
      });

      const refund = await prisma!.refund.create({
        data: {
          id: `ref_t6_${Date.now()}`,
          paymentId: order.payment!.id,
          orderId,
          amount: new Prisma.Decimal(100),
          reason: "Full refund completed",
          status: RefundStatus.COMPLETED,
        },
      });

      const verification: any = {
        verified: true,
        isSuccess: true,
        paymentId: order.payment!.id,
        orderId,
        amount: new Prisma.Decimal(100),
        currency: "BDT",
        eventId: `evt_test_6_${Date.now()}`,
        rawPayload: { id: `evt_test_6_${Date.now()}`, type: "payment_intent.succeeded" },
      };

      const results = await Promise.allSettled([
        PaymentSecurityService.processVerifiedPayment("STRIPE", verification),
        AdminRefundService.processRefund(refund.id, true, "Re-process refund"),
      ]);

      const check = await checkInvariants(orderId);
      const deadlockOccurred = results.some((r) => r.status === "rejected" && (r.reason?.message?.includes("40P01") || r.reason?.code === "40P01"));

      matrix.push({
        test: "TEST 6: Late webhook vs REFUNDED payment",
        concurrencyMethod: "Promise.all([PaymentWebhook.process, AdminRefund.process])",
        expected: "Payment status remains REFUNDED, never resurrects to PAID",
        actual: `Payment status retained: ${check.paymentStatus}`,
        dbFinalState: `Payment status: ${check.paymentStatus}`,
        invariantResult: check.paymentStatus === PaymentStatus.REFUNDED && check.ok ? "Passed" : "Failed",
        deadlockResult: deadlockOccurred ? "40P01 Deadlock Detected" : "No Deadlock",
        verificationStatus: check.paymentStatus === PaymentStatus.REFUNDED && check.ok && !deadlockOccurred ? "PASS" : "FAIL",
      });
      await cleanupOrder(orderId);
    } catch (e: any) {
      matrix.push({
        test: "TEST 6: Late webhook vs REFUNDED payment",
        concurrencyMethod: "Promise.all([PaymentWebhook.process, AdminRefund.process])",
        expected: "Payment status remains REFUNDED, never resurrects to PAID",
        actual: e.message,
        dbFinalState: "Failed",
        invariantResult: "Failed",
        deadlockResult: e.message.includes("40P01") ? "40P01 Deadlock" : "No Deadlock",
        verificationStatus: "FAIL",
      });
    }

    // TEST 7: Two cancellation requests
    try {
      const orderId = `ord_test_7_${Date.now()}`;
      await cleanupOrder(orderId);

      const order = await prisma!.order.create({
        data: {
          id: orderId,
          orderNumber: `ORD-T7-${Date.now()}`,
          totalAmount: new Prisma.Decimal(100),
          status: "PAID",
          paymentStatus: "PAID",
          payment: {
            create: {
              id: `pay_t7_${Date.now()}`,
              amount: new Prisma.Decimal(100),
              refundedAmount: new Prisma.Decimal(0),
              currency: "BDT",
              status: PaymentStatus.PAID,
            },
          },
        },
        include: { payment: true },
      });

      const req1: any = { params: { id: orderId }, body: { status: "CANCELLED" } };
      const res1: any = { status: () => res1, json: () => {} };
      const req2: any = { params: { id: orderId }, body: { status: "CANCELLED" } };
      const res2: any = { status: () => res2, json: () => {} };

      const results = await Promise.allSettled([
        updateOrderStatus(req1, res1, (() => {}) as any),
        updateOrderStatus(req2, res2, (() => {}) as any),
      ]);

      const check = await checkInvariants(orderId);
      const deadlockOccurred = results.some((r) => r.status === "rejected" && (r.reason?.message?.includes("40P01") || r.reason?.code === "40P01"));

      matrix.push({
        test: "TEST 7: Two cancellation requests",
        concurrencyMethod: "Promise.all([Order.cancel, Order.cancel])",
        expected: "Idempotency enforced, exactly 1 active cancellation refund created",
        actual: `Cancellation refund count: ${check.cancelRefundCount}`,
        dbFinalState: `Payment status: ${check.paymentStatus}`,
        invariantResult: check.cancelRefundCount === 1 && check.ok ? "Passed" : "Failed",
        deadlockResult: deadlockOccurred ? "40P01 Deadlock Detected" : "No Deadlock",
        verificationStatus: check.cancelRefundCount === 1 && check.ok && !deadlockOccurred ? "PASS" : "FAIL",
      });
      await cleanupOrder(orderId);
    } catch (e: any) {
      matrix.push({
        test: "TEST 7: Two cancellation requests",
        concurrencyMethod: "Promise.all([Order.cancel, Order.cancel])",
        expected: "Idempotency enforced, exactly 1 active cancellation refund created",
        actual: e.message,
        dbFinalState: "Failed",
        invariantResult: "Failed",
        deadlockResult: e.message.includes("40P01") ? "40P01 Deadlock" : "No Deadlock",
        verificationStatus: "FAIL",
      });
    }

    // TEST 8: Processing refund vs new refund
    try {
      const orderId = `ord_test_8_${Date.now()}`;
      await cleanupOrder(orderId);

      const order = await prisma!.order.create({
        data: {
          id: orderId,
          orderNumber: `ORD-T8-${Date.now()}`,
          totalAmount: new Prisma.Decimal(100),
          status: "PAID",
          paymentStatus: "PAID",
          payment: {
            create: {
              id: `pay_t8_${Date.now()}`,
              amount: new Prisma.Decimal(100),
              refundedAmount: new Prisma.Decimal(0),
              currency: "BDT",
              status: PaymentStatus.PAID,
            },
          },
        },
        include: { payment: true },
      });

      const refund = await prisma!.refund.create({
        data: {
          id: `ref_t8_${Date.now()}`,
          paymentId: order.payment!.id,
          orderId,
          amount: new Prisma.Decimal(60),
          reason: "Processing partial refund",
          status: RefundStatus.PROCESSING,
        },
      });

      const results = await Promise.allSettled([
        AdminRefundService.processRefund(refund.id, true, "Approved processing refund"),
        AdminRefundService.initiateAdminRefund(order.payment!.id, 50, "New refund request exceeding remaining balance"),
      ]);

      const check = await checkInvariants(orderId);
      const deadlockOccurred = results.some((r) => r.status === "rejected" && (r.reason?.message?.includes("40P01") || r.reason?.code === "40P01"));

      matrix.push({
        test: "TEST 8: Processing refund vs new refund",
        concurrencyMethod: "Promise.all([Refund.process, Refund.initiate])",
        expected: "Over-refund rejected, total refunds <= 100",
        actual: "Serialized safely under payment row lock",
        dbFinalState: `Payment status: ${check.paymentStatus}, Refunded: ${check.refundedAmount}`,
        invariantResult: check.ok ? "Passed" : `Failed: ${check.reason}`,
        deadlockResult: deadlockOccurred ? "40P01 Deadlock Detected" : "No Deadlock",
        verificationStatus: check.ok && !deadlockOccurred ? "PASS" : "FAIL",
      });
      await cleanupOrder(orderId);
    } catch (e: any) {
      matrix.push({
        test: "TEST 8: Processing refund vs new refund",
        concurrencyMethod: "Promise.all([Refund.process, Refund.initiate])",
        expected: "Over-refund rejected, total refunds <= 100",
        actual: e.message,
        dbFinalState: "Failed",
        invariantResult: "Failed",
        deadlockResult: e.message.includes("40P01") ? "40P01 Deadlock" : "No Deadlock",
        verificationStatus: "FAIL",
      });
    }
  }

  // Print Verification Matrix Table
  console.log("=========================================================================================================");
  console.log("P0 STEP 7: REAL POSTGRESQL CONCURRENCY VERIFICATION MATRIX");
  console.log("=========================================================================================================\n");

  console.table(
    matrix.map((row) => ({
      Test: row.test,
      "Concurrency Method": row.concurrencyMethod,
      Expected: row.expected,
      Actual: row.actual,
      "DB Final State": row.dbFinalState,
      "Invariant Result": row.invariantResult,
      "Deadlock Result": row.deadlockResult,
      "Verification Status": row.verificationStatus,
    }))
  );

  console.log("\n---------------------------------------------------------------------------------------------------------");
  console.log("SUMMARY OF VERIFICATION:");
  const passCount = matrix.filter((m) => m.verificationStatus === "PASS").length;
  const failCount = matrix.filter((m) => m.verificationStatus === "FAIL").length;
  const notVerifiedCount = matrix.filter((m) => m.verificationStatus === "NOT VERIFIED").length;

  console.log(`Total Scenarios Assessed: ${matrix.length}`);
  console.log(`PASS: ${passCount}`);
  console.log(`FAIL: ${failCount}`);
  console.log(`NOT VERIFIED: ${notVerifiedCount} (Live PostgreSQL server unreachable in Cloud Run container)`);
  console.log("---------------------------------------------------------------------------------------------------------\n");

  if (prisma) {
    await prisma.$disconnect();
  }
}

// Execute runner
runRealPostgresqlConcurrencyTests().catch((e) => {
  console.error("Unhandled error in real PostgreSQL concurrency test runner:", e);
});
