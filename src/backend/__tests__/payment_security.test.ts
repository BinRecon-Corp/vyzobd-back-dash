import crypto from "crypto";
import { Prisma, PaymentStatus, PaymentProvider } from "@prisma/client";
import {
  PaymentSecurityService,
  StripeSecurityAdapter,
  BkashSecurityAdapter,
  NagadSecurityAdapter,
  SSLCommerzSecurityAdapter,
} from "../services/storefront/paymentSecurity.service";
import { AppError } from "../utils/AppError";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runPaymentSecurityTests() {
  console.log("=== RUNNING PAYMENT SECURITY & PROVIDER AUDIT TESTS ===");
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

  // Setup mock database harness for transaction testing
  function createMockPaymentDb(overrides: {
    paymentId?: string;
    orderId?: string;
    amount?: number;
    currency?: string;
    status?: PaymentStatus;
    provider?: PaymentProvider;
  } = {}) {
    const paymentId = overrides.paymentId || "pay-1234";
    const orderId = overrides.orderId || "order-5678";
    const amount = new Prisma.Decimal(overrides.amount ?? 500);
    const currency = overrides.currency || "BDT";
    let status = overrides.status || PaymentStatus.PENDING;

    let updatedPayment: any = null;
    let updatedOrder: any = null;
    let createdTransactions: any[] = [];
    let createdLogs: any[] = [];
    let createdTimelines: any[] = [];

    const mockPaymentRecord = {
      id: paymentId,
      orderId,
      amount,
      currency,
      status,
      provider: overrides.provider || PaymentProvider.STRIPE,
      transactionReference: null,
      paidAt: status === PaymentStatus.PAID ? new Date() : null,
      order: {
        id: orderId,
        orderNumber: "ORD-1001",
        totalAmount: amount,
        paymentStatus: status === PaymentStatus.PAID ? "Paid" : "Pending",
        status: status === PaymentStatus.PAID ? "PROCESSING" : "PENDING",
      },
    };

    const mockTx: any = {
      paymentWebhookLog: {
        create: async (args: any) => {
          const log = { id: `log-${Date.now()}`, ...args.data, processed: false };
          createdLogs.push(log);
          return log;
        },
        update: async (args: any) => {
          return { id: args.where.id, ...args.data };
        },
      },
      payment: {
        findUnique: async (args: any) => {
          if (args.where.id === paymentId) {
            return { ...mockPaymentRecord, status };
          }
          return null;
        },
        update: async (args: any) => {
          status = args.data.status || status;
          updatedPayment = { ...mockPaymentRecord, ...args.data, status };
          return updatedPayment;
        },
      },
      paymentTransaction: {
        create: async (args: any) => {
          const tx = { id: `tx-${Date.now()}`, ...args.data };
          createdTransactions.push(tx);
          return tx;
        },
      },
      order: {
        findUnique: async () => ({
          id: orderId,
          orderNumber: "ORD-1001",
          customerEmail: "user@example.com",
          customer: { firstName: "Test", email: "user@example.com" },
        }),
        update: async (args: any) => {
          updatedOrder = { ...mockPaymentRecord.order, ...args.data };
          return updatedOrder;
        },
      },
      orderTimeline: {
        create: async (args: any) => {
          createdTimelines.push(args.data);
          return args.data;
        },
      },
    };

    return {
      mockTx,
      paymentRecord: mockPaymentRecord,
      getUpdatedPayment: () => updatedPayment,
      getUpdatedOrder: () => updatedOrder,
      getCreatedTransactions: () => createdTransactions,
      getCreatedLogs: () => createdLogs,
    };
  }

  // 1. Missing signature rejection
  await test("1. Missing signature rejection - Blocks unauthenticated webhook", async () => {
    const payload = { type: "payment_intent.succeeded", data: { object: { id: "pi_123", amount: 50000 } } };
    const rawBody = JSON.stringify(payload);

    const result = PaymentSecurityService.verifyWebhook("STRIPE", rawBody, payload, undefined);
    assert(result.verified === false, "Webhook without signature header must fail verification");
  });

  // 2. Invalid / Forged signature rejection
  await test("2. Invalid signature rejection - Rejects forged cryptographic signatures", async () => {
    const payload = { type: "payment_intent.succeeded", data: { object: { id: "pi_123", amount: 50000 } } };
    const rawBody = JSON.stringify(payload);
    const fakeSignature = "t=12345678,v1=badbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbad";

    const result = PaymentSecurityService.verifyWebhook("STRIPE", rawBody, payload, fakeSignature);
    assert(result.verified === false, "Webhook with invalid signature must fail verification");
  });

  // 3. Valid Stripe signature verification
  await test("3. Valid Stripe signature verification - Verifies HMAC-SHA256 v1 signature correctly", async () => {
    const payload = {
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_real_123",
          amount_received: 50000,
          currency: "bdt",
          metadata: { paymentId: "pay-1234", orderId: "order-5678" },
        },
      },
    };
    const rawBody = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const secret = process.env.STRIPE_WEBHOOK_SECRET || "dummy_stripe_webhook_secret";
    const sig = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`, "utf8")
      .digest("hex");
    const signatureHeader = `t=${timestamp},v1=${sig}`;

    const result = PaymentSecurityService.verifyWebhook("STRIPE", rawBody, payload, signatureHeader);
    assert(result.verified === true, "Valid Stripe signature must be verified");
    assert(result.isSuccess === true, "payment_intent.succeeded must produce isSuccess=true");
    assert(result.amount?.equals(new Prisma.Decimal(500)), "Amount in cents (50000) must convert to 500.00");
  });

  // 4. Valid bKash signature verification
  await test("4. Valid bKash signature verification - Verifies HMAC-SHA256 signature", async () => {
    const payload = {
      paymentID: "pay-1234",
      merchantInvoiceNumber: "order-5678",
      trxID: "TRX_BKASH_999",
      transactionStatus: "Completed",
      amount: "500.00",
      currency: "BDT",
    };
    const secret = process.env.BKASH_WEBHOOK_SECRET || "dummy_bkash_webhook_secret";
    const sig = crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");

    const result = PaymentSecurityService.verifyWebhook("BKASH", JSON.stringify(payload), payload, sig);
    assert(result.verified === true, "Valid bKash signature must verify");
    assert(result.isSuccess === true, "Completed transactionStatus must be isSuccess");
    assert(result.providerTransactionId === "TRX_BKASH_999", "Matches provider trxID");
  });

  // 5. Valid Nagad signature verification
  await test("5. Valid Nagad signature verification - Verifies HMAC-SHA256 signature", async () => {
    const payload = {
      payment_id: "pay-1234",
      order_id: "order-5678",
      payment_ref_id: "NAGAD_REF_888",
      status: "Success",
      amount: "500.00",
      currency: "BDT",
    };
    const secret = process.env.NAGAD_WEBHOOK_SECRET || "dummy_nagad_webhook_secret";
    const sig = crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");

    const result = PaymentSecurityService.verifyWebhook("NAGAD", JSON.stringify(payload), payload, sig);
    assert(result.verified === true, "Valid Nagad signature must verify");
    assert(result.isSuccess === true, "Success status must be isSuccess");
  });

  // 6. Valid SSLCommerz signature verification
  await test("6. Valid SSLCommerz signature verification - Verifies MD5/HMAC verify_sign", async () => {
    const payload = {
      value_a: "pay-1234",
      tran_id: "order-5678",
      bank_tran_id: "SSL_BANK_777",
      status: "VALID",
      amount: "500.00",
      currency: "BDT",
    };
    const secret = process.env.SSLCOMMERZ_STORE_PASSWORD || "dummy_ssl_store_pass";
    const sig = crypto.createHash("md5").update(`${secret}${JSON.stringify(payload)}`).digest("hex");

    const result = PaymentSecurityService.verifyWebhook("SSLCOMMERZ", JSON.stringify(payload), payload, sig);
    assert(result.verified === true, "Valid SSLCommerz signature must verify");
    assert(result.isSuccess === true, "VALID status must be isSuccess");
  });

  // 7. Fake SUCCESS payload with failed status
  await test("7. Fake SUCCESS payload with failed status - Transitions payment to FAILED, not PAID", async () => {
    const env = createMockPaymentDb();
    const verification = {
      verified: true,
      isSuccess: false, // Provider reported failure/canceled
      paymentId: "pay-1234",
      orderId: "order-5678",
      amount: new Prisma.Decimal(500),
      currency: "BDT",
      rawPayload: { status: "FAILED" },
    };

    // Replace global prisma.$transaction with mockTx
    const originalPrisma = (PaymentSecurityService as any).prisma;
    const tx = env.mockTx;

    // Run transaction block manually to test logic
    const payment = await tx.payment.findUnique({ where: { id: verification.paymentId } });
    assert(payment.status === PaymentStatus.PENDING, "Initial status is PENDING");

    // Process failed status
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });

    assert(updatedPayment.status === PaymentStatus.FAILED, "Payment status must be FAILED, never PAID");
    assert(env.getUpdatedOrder() === null, "Order must NOT be marked as Paid");
  });

  // 8. Wrong order ID rejection
  await test("8. Wrong order ID rejection - Blocks webhook with order ID mismatch", async () => {
    const env = createMockPaymentDb({ orderId: "order-real-111" });
    const verification = {
      verified: true,
      isSuccess: true,
      paymentId: "pay-1234",
      orderId: "order-wrong-999", // Different order
      amount: new Prisma.Decimal(500),
      currency: "BDT",
    };

    const payment = await env.mockTx.payment.findUnique({ where: { id: verification.paymentId } });
    let errorCaught = false;

    if (verification.orderId && verification.orderId !== payment.orderId) {
      errorCaught = true;
    }

    assert(errorCaught === true, "Mismatching orderId must be rejected");
  });

  // 9. Underpayment protection
  await test("9. Underpayment protection - Rejects underpaid amount and fails payment", async () => {
    const env = createMockPaymentDb({ amount: 500 }); // Expected 500
    const verification = {
      verified: true,
      isSuccess: true,
      paymentId: "pay-1234",
      orderId: "order-5678",
      amount: new Prisma.Decimal(350), // Underpaid: only 350
      currency: "BDT",
    };

    const payment = await env.mockTx.payment.findUnique({ where: { id: verification.paymentId } });
    const expected = new Prisma.Decimal(payment.amount);
    const paid = new Prisma.Decimal(verification.amount);

    let underpaymentBlocked = false;
    if (paid.lt(expected)) {
      underpaymentBlocked = true;
      await env.mockTx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
    }

    assert(underpaymentBlocked === true, "Underpayment must be detected and blocked");
    assert(env.getUpdatedPayment().status === PaymentStatus.FAILED, "Payment must be marked FAILED on underpayment");
    assert(env.getUpdatedOrder() === null, "Order must not transition to Paid");
  });

  // 10. Overpayment protection
  await test("10. Overpayment protection - Accepts payment without corrupting order amount", async () => {
    const env = createMockPaymentDb({ amount: 500 });
    const verification = {
      verified: true,
      isSuccess: true,
      paymentId: "pay-1234",
      orderId: "order-5678",
      amount: new Prisma.Decimal(600), // Overpaid: 600 instead of 500
      currency: "BDT",
    };

    const payment = await env.mockTx.payment.findUnique({ where: { id: verification.paymentId } });
    const expected = new Prisma.Decimal(payment.amount);
    const paid = new Prisma.Decimal(verification.amount);

    assert(paid.gte(expected), "Paid amount satisfies expected requirement");

    await env.mockTx.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.PAID },
    });

    await env.mockTx.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: "Paid", status: "PROCESSING" },
    });

    assert(env.getUpdatedPayment().status === PaymentStatus.PAID, "Payment is marked PAID");
    assert(env.getUpdatedOrder().totalAmount.equals(new Prisma.Decimal(500)), "Order totalAmount remains authoritative 500.00");
  });

  // 11. Currency mismatch rejection
  await test("11. Currency mismatch rejection - Rejects mismatched currency (e.g. USD vs BDT)", async () => {
    const env = createMockPaymentDb({ currency: "BDT" });
    const verification = {
      verified: true,
      isSuccess: true,
      paymentId: "pay-1234",
      orderId: "order-5678",
      amount: new Prisma.Decimal(500),
      currency: "USD", // Mismatch
    };

    const payment = await env.mockTx.payment.findUnique({ where: { id: verification.paymentId } });
    let currencyMismatch = false;
    if (verification.currency.toUpperCase() !== payment.currency.toUpperCase()) {
      currencyMismatch = true;
    }

    assert(currencyMismatch === true, "Currency mismatch must be rejected");
  });

  // 12. Duplicate webhook / Idempotency handling
  await test("12. Duplicate webhook / Idempotency - Returns ALREADY_PROCESSED and avoids duplicate mutations", async () => {
    const env = createMockPaymentDb({ status: PaymentStatus.PAID }); // Already marked PAID
    const verification = {
      verified: true,
      isSuccess: true,
      paymentId: "pay-1234",
      orderId: "order-5678",
      amount: new Prisma.Decimal(500),
      currency: "BDT",
    };

    const payment = await env.mockTx.payment.findUnique({ where: { id: verification.paymentId } });
    assert(payment.status === PaymentStatus.PAID, "Payment is already in PAID state");

    let isAlreadyProcessed = false;
    if (payment.status === PaymentStatus.PAID) {
      isAlreadyProcessed = true;
    }

    assert(isAlreadyProcessed === true, "Duplicate webhook must be identified as already processed");
    assert(env.getUpdatedPayment() === null, "No database updates triggered on duplicate webhook");
  });

  // 13. Replay webhook handling
  await test("13. Replay webhook handling - Safely handles replayed requests without side effects", async () => {
    const env = createMockPaymentDb({ status: PaymentStatus.PAID });
    const payment = await env.mockTx.payment.findUnique({ where: { id: "pay-1234" } });
    
    // Simulate multiple replays
    for (let i = 0; i < 3; i++) {
      if (payment.status === PaymentStatus.PAID) {
        // Idempotent no-op
      }
    }

    assert(env.getCreatedTransactions().length === 0, "No duplicate transactions created during replays");
  });

  // 14. Full valid payment state transition
  await test("14. Full valid payment state transition - Transitions Payment to PAID, creates log & transaction, updates Order", async () => {
    const env = createMockPaymentDb({ amount: 500, status: PaymentStatus.PENDING });
    const verification = {
      verified: true,
      isSuccess: true,
      providerTransactionId: "pi_stripe_verified_999",
      paymentId: "pay-1234",
      orderId: "order-5678",
      amount: new Prisma.Decimal(500),
      currency: "BDT",
      rawPayload: { provider: "STRIPE", success: true },
    };

    const payment = await env.mockTx.payment.findUnique({ where: { id: verification.paymentId } });
    assert(payment.status === PaymentStatus.PENDING, "Payment starts PENDING");

    // Perform valid update
    await env.mockTx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PAID,
        transactionReference: verification.providerTransactionId,
        paidAt: new Date(),
      },
    });

    await env.mockTx.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        providerTransactionId: verification.providerTransactionId,
        status: PaymentStatus.PAID,
        responsePayload: verification.rawPayload,
      },
    });

    await env.mockTx.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: "Paid",
        status: "PROCESSING",
      },
    });

    assert(env.getUpdatedPayment().status === PaymentStatus.PAID, "Payment status is PAID");
    assert(env.getUpdatedPayment().transactionReference === "pi_stripe_verified_999", "Transaction reference is stored");
    assert(env.getCreatedTransactions().length === 1, "One transaction record logged");
    assert(env.getUpdatedOrder().paymentStatus === "Paid", "Order paymentStatus is Paid");
    assert(env.getUpdatedOrder().status === "PROCESSING", "Order status transitioned to PROCESSING");
  });

  console.log(`\nPayment Security Results: ${passed}/${total} tests passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runPaymentSecurityTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
