import { prisma } from "../../config/db";
import { AppError } from "../../utils/AppError";
import { normalizePhone } from "../../utils/phone";

export class StorefrontReviewService {
  /**
   * Verify purchase eligibility and submit the review atomically.
   */
  static async submitReview(payload: {
    productId: string;
    name: string;
    mobile: string;
    email?: string | null;
    rating: number;
    reviewHeadline?: string | null;
    reviewComment: string;
    images?: string[];
  }, customerId?: string) {
    const normalizedMobile = normalizePhone(payload.mobile);
    if (!normalizedMobile) {
      throw new AppError("Invalid mobile number", 400, "INVALID_MOBILE");
    }

    // Wrap in a transaction for concurrency safety
    return await prisma.$transaction(async (tx) => {
      // 1. Find all eligible order items for this mobile number and product.
      // Criteria:
      // - Order status is "Delivered"
      // - Product matches
      // - Mobile matches either customer.phone or shippingAddress text
      const eligibleOrderItems = await tx.orderItem.findMany({
        where: {
          productId: payload.productId,
          order: {
            status: "Delivered",
            OR: [
              { customer: { phone: { contains: normalizedMobile } } },
              { shippingAddress: { contains: normalizedMobile } }
            ]
          },
          // Find ones that DO NOT have a review associated yet.
          review: null
        },
        // We lock these rows (if supported by prisma natively, but Prisma doesn't support SELECT FOR UPDATE well here without raw query.
        // Wait, since we are doing a unique check, we can rely on orderItemId uniqueness constraint and the fact that we pick one that has review: null).
        orderBy: {
          order: {
            createdAt: 'asc'
          }
        },
        take: 1
      });

      if (eligibleOrderItems.length === 0) {
        throw new AppError(
          "Please purchase this product before submitting a review, or you have reached your review limit.",
          403,
          "PURCHASE_REQUIRED"
        );
      }

      const qualifyingItem = eligibleOrderItems[0];

      // 2. Create the review
      // The schema has @unique on orderItemId, so if two concurrent transactions try to use the same orderItemId, the second will fail with a unique constraint violation.
      try {
        const review = await tx.review.create({
          data: {
            productId: payload.productId,
            orderItemId: qualifyingItem.id,
            customerId: customerId || null,
            customerName: payload.name,
            customerMobile: normalizedMobile,
            customerEmail: payload.email || null,
            rating: payload.rating,
            headline: payload.reviewHeadline || null,
            comment: payload.reviewComment,
            isVerifiedPurchase: true,
            status: "PENDING", // Wait for approval
            images: {
              create: (payload.images || []).map((url) => ({
                url,
                // optional: parse cloudinary public id if needed
              })),
            },
          },
        });

        return review;
      } catch (e: any) {
        if (e.code === 'P2002' && e.meta?.target?.includes('orderItemId')) {
          throw new AppError("This purchase has already been reviewed", 409, "ALREADY_REVIEWED");
        }
        throw e;
      }
    });
  }

  static async getProductReviews(productId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId, status: "APPROVED" },
        include: { images: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { productId, status: "APPROVED" } }),
    ]);

    // Aggregate rating
    const aggregates = await prisma.review.groupBy({
      by: ['rating'],
      where: { productId, status: "APPROVED" },
      _count: {
        id: true,
      }
    });

    let totalRating = 0;
    let count = 0;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    aggregates.forEach(agg => {
      distribution[agg.rating] = agg._count.id;
      totalRating += (agg.rating * agg._count.id);
      count += agg._count.id;
    });

    const averageRating = count > 0 ? (totalRating / count).toFixed(1) : 0;

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        averageRating,
        totalReviews: count,
        distribution,
      }
    };
  }

  

  static async getFeaturedReviews(limit: number = 5) {
    const maxLimit = Math.min(limit, 10);
    
    // Fetch minimal info for all eligible reviews
    const eligibleReviews = await prisma.review.findMany({
      where: { 
        status: "APPROVED",
        product: {
          isActive: true,
          status: "Active",
          deletedAt: null
        }
      },
      select: {
        id: true,
        productId: true
      }
    });

    if (eligibleReviews.length === 0) {
      return [];
    }

    // Group by product to ensure diversity
    const byProduct: Record<string, string[]> = {};
    for (const r of eligibleReviews) {
      if (!byProduct[r.productId]) byProduct[r.productId] = [];
      byProduct[r.productId].push(r.id);
    }

    // Shuffle arrays
    const shuffle = (array: any[]) => array.sort(() => 0.5 - Math.random());
    for (const productId in byProduct) {
      shuffle(byProduct[productId]);
    }

    // Pick up to maxLimit reviews, prioritizing different products
    const selectedIds: string[] = [];
    const productIds = Object.keys(byProduct);
    shuffle(productIds);

    let round = 0;
    while (selectedIds.length < maxLimit) {
      let addedInRound = false;
      for (const pid of productIds) {
        if (selectedIds.length >= maxLimit) break;
        if (byProduct[pid].length > round) {
          selectedIds.push(byProduct[pid][round]);
          addedInRound = true;
        }
      }
      if (!addedInRound) break; // Exhausted all reviews
      round++;
    }

    // Fetch full details for selected IDs
    const reviews = await prisma.review.findMany({
      where: { id: { in: selectedIds } },
      include: {
        images: true,
        product: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1
            }
          }
        }
      }
    });

    shuffle(reviews);
    
    return reviews.map(r => ({
      id: r.id,
      customerName: r.customerName || "Anonymous",
      rating: r.rating,
      headline: r.headline,
      comment: r.comment,
      createdAt: r.createdAt,
      isVerifiedPurchase: r.isVerifiedPurchase,
      images: r.images.map(img => img.url),
      product: {
        id: r.product.id,
        name: r.product.name,
        slug: r.product.slug,
        image: r.product.images[0]?.url || ""
      }
    }));
  }
  static async checkEligibility(productId: string, mobile: string) {
    const normalizedMobile = normalizePhone(mobile);
    if (!normalizedMobile) {
      return { eligible: false, availableSlots: 0, qualifyingOrderIds: [] };
    }

    const eligibleItems = await prisma.orderItem.findMany({
      where: {
        productId,
        order: {
          status: "Delivered",
          OR: [
            { customer: { phone: { contains: normalizedMobile } } },
            { shippingAddress: { contains: normalizedMobile } }
          ]
        },
        review: null
      },
      select: { orderId: true }
    });

    return {
      eligible: eligibleItems.length > 0,
      availableSlots: eligibleItems.length,
      qualifyingOrderIds: eligibleItems.map(item => item.orderId)
    };
  }
}
