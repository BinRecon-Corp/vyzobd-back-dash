import { prisma } from "../../config/db";
import { AppError } from "../../utils/AppError";

export class StorefrontOrderService {
  static async getCustomerOrders(
    customerId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
    }
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {
      customerId,
      deletedAt: null,
    };

    if (options.status) {
      where.status = options.status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                    select: { url: true },
                  },
                },
              },
              productVariant: {
                select: {
                  id: true,
                  sku: true,
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getCustomerOrderById(customerId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId,
        deletedAt: null,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                  select: { url: true },
                },
              },
            },
            productVariant: {
              select: {
                id: true,
                sku: true,
              },
            },
          },
        },
        coupon: {
          select: {
            code: true,
            discountType: true,
            discountValue: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppError("Order not found", 404, "NOT_FOUND");
    }

    return order;
  }

  static async getCustomerOrderTimeline(customerId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId,
        deletedAt: null,
      },
      select: { id: true, orderNumber: true, status: true },
    });

    if (!order) {
      throw new AppError("Order not found", 404, "NOT_FOUND");
    }

    const timeline = await prisma.orderTimeline.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        status: true,
        action: true,
        createdAt: true,
      },
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      timeline,
    };
  }
}
