import { prisma } from "../../config/db";
import { AppError } from "../../utils/AppError";
import { normalizePhone } from "../../utils/phone";
import { cloudinary, isCloudinaryConfigured } from "../../config/cloudinary";

export class StorefrontReviewService {
  static async submitGuestReview(payload: {
    productId: string;
    name: string;
    mobile: string;
    email?: string | null;
    rating: number;
    reviewHeadline?: string | null;
    reviewComment: string;
    images?: string[];
  }) {
    const normalizedMobile = normalizePhone(payload.mobile);
    if (!normalizedMobile) {
      throw new AppError("Invalid mobile number", 400, "INVALID_MOBILE");
    }

    return await prisma.$transaction(async (tx) => {
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
          review: null
        },
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

      
      // Atomic locking of UploadTrackers to prevent reuse across concurrent requests
      let imageTrackerRecords = [];
      if (payload.images && payload.images.length > 0) {
        const lockResult = await tx.uploadTracker.updateMany({
          where: {
            url: { in: payload.images },
            status: "PENDING"
          },
          data: { status: "ATTACHED" }
        });
        
        if (lockResult.count !== payload.images.length) {
          throw new AppError("One or more images are invalid or have already been attached", 400, "INVALID_IMAGES");
        }
        
        imageTrackerRecords = await tx.uploadTracker.findMany({
          where: {
            url: { in: payload.images },
            status: "ATTACHED"
          }
        });
      }
      const imagesWithPublicIds = imageTrackerRecords.map(tracker => ({ url: tracker.url, cloudinaryPublicId: tracker.publicId }));

      try {
        const review = await tx.review.create({

          data: {
            productId: payload.productId,
            orderItemId: qualifyingItem.id,
            customerId: null,
            customerName: payload.name,
            customerMobile: normalizedMobile,
            customerEmail: payload.email || null,
            rating: payload.rating,
            headline: payload.reviewHeadline || null,
            comment: payload.reviewComment,
            isVerifiedPurchase: true,
            status: "PENDING",
            
            images: {
              create: imagesWithPublicIds,
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

  static async submitAuthenticatedReview(payload: {
    productId: string;
    rating: number;
    reviewHeadline?: string | null;
    reviewComment: string;
    images?: string[];
  }, customerId: string) {
    
    return await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId }
      });
      if (!customer) {
        throw new AppError("Customer not found", 404, "NOT_FOUND");
      }

      const eligibleOrderItems = await tx.orderItem.findMany({
        where: {
          productId: payload.productId,
          order: {
            customerId: customerId,
            status: "Delivered"
          },
          review: null
        },
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

      
      // Atomic locking of UploadTrackers to prevent reuse across concurrent requests
      let imageTrackerRecords = [];
      if (payload.images && payload.images.length > 0) {
        const lockResult = await tx.uploadTracker.updateMany({
          where: {
            url: { in: payload.images },
            status: "PENDING"
          },
          data: { status: "ATTACHED" }
        });
        
        if (lockResult.count !== payload.images.length) {
          throw new AppError("One or more images are invalid or have already been attached", 400, "INVALID_IMAGES");
        }
        
        imageTrackerRecords = await tx.uploadTracker.findMany({
          where: {
            url: { in: payload.images },
            status: "ATTACHED"
          }
        });
      }
      const imagesWithPublicIds = imageTrackerRecords.map(tracker => ({ url: tracker.url, cloudinaryPublicId: tracker.publicId }));

      try {
        const review = await tx.review.create({

          data: {
            productId: payload.productId,
            orderItemId: qualifyingItem.id,
            customerId: customerId,
            customerName: `${customer.firstName} ${customer.lastName || ''}`.trim(),
            customerMobile: customer.phone,
            customerEmail: customer.email,
            rating: payload.rating,
            headline: payload.reviewHeadline || null,
            comment: payload.reviewComment,
            isVerifiedPurchase: true,
            status: "PENDING",
            
            images: {
              create: imagesWithPublicIds,
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
      reviews: reviews.map(r => ({
        id: r.id,
        customerName: r.customerName || "Anonymous",
        rating: r.rating,
        headline: r.headline,
        comment: r.comment,
        createdAt: r.createdAt,
        isVerifiedPurchase: r.isVerifiedPurchase,
        adminResponse: r.adminResponse,
        images: r.images.map(img => img.url)
      })),
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

    const byProduct: Record<string, string[]> = {};
    for (const r of eligibleReviews) {
      if (!byProduct[r.productId]) byProduct[r.productId] = [];
      byProduct[r.productId].push(r.id);
    }

    const shuffle = (array: any[]) => array.sort(() => 0.5 - Math.random());
    for (const productId in byProduct) {
      shuffle(byProduct[productId]);
    }

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
      if (!addedInRound) break; 
      round++;
    }

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
        adminResponse: r.adminResponse,
        images: r.images.map(img => img.url),
      product: {
        id: r.product.id,
        name: r.product.name,
        slug: r.product.slug,
        image: r.product.images[0]?.url || ""
      }
    }));
  }

  static async checkGuestEligibility(productId: string, mobile: string) {
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

  static async checkAuthenticatedEligibility(productId: string, customerId: string) {
    const eligibleItems = await prisma.orderItem.findMany({
      where: {
        productId,
        order: {
          customerId: customerId,
          status: "Delivered"
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

  static async getMyReviews(customerId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { customerId },
        include: { images: true, product: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { customerId } }),
    ]);

    return {
      reviews: reviews.map(r => ({
        id: r.id,
        productName: r.product.name,
        productId: r.product.id,
        rating: r.rating,
        headline: r.headline,
        comment: r.comment,
        createdAt: r.createdAt,
        status: r.status,
        isVerifiedPurchase: r.isVerifiedPurchase,
        adminResponse: r.adminResponse,
        images: r.images.map(img => img.url)
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  static async uploadReviewImage(fileBuffer: Buffer) {
    if (!isCloudinaryConfigured()) {
      throw new AppError("Cloudinary is not configured", 500, "CONFIG_ERROR");
    }
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "reviews",
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png", "webp"],
          transformation: [{ width: 1000, height: 1000, crop: "limit" }]
        },
        async (error, result) => {
          if (error) {
            return reject(new AppError("Failed to upload image", 500, "UPLOAD_ERROR"));
          }
          
          try {
            await prisma.uploadTracker.create({
              data: {
                publicId: result?.public_id,
                url: result?.secure_url,
                status: "PENDING"
              }
            });
            resolve({
              url: result?.secure_url,
              public_id: result?.public_id,
              width: result?.width,
              height: result?.height
            });
          } catch (e) {
            reject(new AppError("Failed to track upload", 500, "UPLOAD_ERROR"));
          }
        }
      );
      uploadStream.end(fileBuffer);
    });
  }
}
