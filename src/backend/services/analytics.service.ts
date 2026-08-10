import { prisma } from "../config/db";

export class AdminAnalyticsService {
  static async getOverview() {
    const [totalCustomers, activeCustomers, totalOrders, revenueData, refunds, abandonedCarts] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: { not: 'Cancelled' } } }),
      prisma.refund.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } }),
      prisma.abandonedCart.count()
    ]);

    return {
      totalCustomers,
      activeCustomers,
      newCustomers: 0, // Could be calculated based on date ranges
      totalOrders,
      revenue: revenueData._sum.totalAmount || 0,
      refunds: refunds._sum.amount || 0,
      abandonedCarts
    };
  }

  static async getCustomerAnalytics() {
    // Top customers by order count
    const topCustomers = await prisma.order.groupBy({
      by: ['customerId'],
      _count: { id: true },
      _sum: { totalAmount: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    const populatedTopCustomers = await Promise.all(topCustomers.map(async (tc) => {
      const c = await prisma.customer.findUnique({ where: { id: tc.customerId }, select: { id: true, firstName: true, lastName: true, email: true }});
      return { ...tc, customer: c };
    }));

    return {
      topCustomers: populatedTopCustomers
    };
  }

  static async getProductAnalytics() {
    const topPurchased = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10
    });

    const populatedTopPurchased = await Promise.all(topPurchased.map(async (tp) => {
      const p = await prisma.product.findUnique({ where: { id: tp.productId }, select: { id: true, name: true, slug: true }});
      return { ...tp, product: p };
    }));

    return {
      topPurchased: populatedTopPurchased
    };
  }
}
