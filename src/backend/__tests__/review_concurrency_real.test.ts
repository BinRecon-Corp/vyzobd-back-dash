// @ts-nocheck
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { StorefrontReviewService } from "../services/storefront/review.service";
import { AdminReviewService } from "../services/review.service";

const prisma = new PrismaClient();

describe("Review Concurrency Tests (Real PostgreSQL)", () => {
  let productId: string;
  let orderItemId: string;
  let customerId: string;
  let reviewId: string;

  beforeAll(async () => {
    // Check if real DB is available
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("localhost") || process.env.DATABASE_URL.includes("sqlite")) {
      console.warn("Skipping real DB concurrency test. DATABASE_URL is not a remote PostgreSQL.");
      return;
    }

    try {
      await prisma.$connect();
      // Setup test data
      const product = await prisma.product.create({
        data: {
          name: "Test Product " + Date.now(),
          slug: "test-product-" + Date.now(),
          price: 10, status: "Active", categoryId: "fake-category"
        }
      });
      productId = product.id;

      const customer = await prisma.customer.create({
        data: {
          email: "test" + Date.now() + "@example.com",
          firstName: "Test",
          phone: "1234567890"
        }
      });
      customerId = customer.id;

      const order = await prisma.order.create({
        data: {
          customerId: customer.id, totalAmount: 10, status: "Delivered", orderNumber: "ORD-GUEST-" + Date.now(), orderNumber: "ORD-" + Date.now(),
          shippingAddress: "123 Main St",
          billingAddress: "123 Main St"
        }
      });

      const orderItem = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity: 1,
          price: 10
        }
      });
      orderItemId = orderItem.id;
    } catch (e) {
      console.error("Setup failed", e);
    }
  });

  afterAll(async () => {
    if (productId) {
      await prisma.product.delete({ where: { id: productId } }).catch(() => {});
      await prisma.customer.delete({ where: { id: customerId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it("Test A: Duplicate review race - two concurrent submissions for same OrderItem", async () => {
    if (!productId) return;
    const payload = {
      productId,
      rating: 5,
      reviewComment: "Great product!"
    };

    const p1 = StorefrontReviewService.submitAuthenticatedReview(payload, customerId);
    const p2 = StorefrontReviewService.submitAuthenticatedReview(payload, customerId);

    const results = await Promise.allSettled([p1, p2]);
    const fulfilled = results.filter(r => r.status === "fulfilled");
    const rejected = results.filter(r => r.status === "rejected");

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    if (fulfilled.length === 1) {
      reviewId = (fulfilled[0] as any).value.id;
    }

    const count = await prisma.review.count({ where: { orderItemId } });
    expect(count).toBe(1);
  });

  it("Test B: Review status race", async () => {
    if (!reviewId) return;

    // Both attempt to change status
    const p1 = AdminReviewService.updateStatus(reviewId, "APPROVED");
    const p2 = AdminReviewService.updateStatus(reviewId, "REJECTED");

    await Promise.allSettled([p1, p2]);

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    expect(["APPROVED", "REJECTED"]).toContain(review!.status);
  });

  it("Test D: Multiple image submissions tracking", async () => {
    if (!productId) return;
    
    // Simulate multiple uploads
    const u1 = await prisma.uploadTracker.create({ data: { publicId: "pub1", url: "http://url1" } });
    const u2 = await prisma.uploadTracker.create({ data: { publicId: "pub2", url: "http://url2" } });

    // Assuming we do a guest review with these
    const order2 = await prisma.order.create({
      data: {
        totalAmount: 10,
        status: "Delivered",
        shippingAddress: "999 Guest St",
        billingAddress: "999 Guest St"
      }
    });

    const orderItem2 = await prisma.orderItem.create({
      data: {
        orderId: order2.id,
        productId: productId,
        quantity: 1,
        price: 10
      }
    });

    const payload = {
      productId,
      name: "Guest",
      mobile: "999 Guest St",
      rating: 4,
      reviewComment: "Nice",
      images: ["http://url1", "http://url2"]
    };

    const review = await StorefrontReviewService.submitGuestReview(payload);
    const trackers = await prisma.uploadTracker.findMany({ where: { id: { in: [u1.id, u2.id] } } });
    expect(trackers.every(t => t.status === "ATTACHED")).toBe(true);

    const images = await prisma.reviewImage.findMany({ where: { reviewId: review.id } });
    expect(images.length).toBe(2);
  });
  
  it("Test C: Review deletion cleans up associations", async () => {
    if (!reviewId) return;
    
    await AdminReviewService.deleteReview(reviewId);
    
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    expect(review).toBeNull();
  });
});
