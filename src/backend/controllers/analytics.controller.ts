import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { AppError } from "../utils/AppError";
import { prisma } from "../config/db";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

export const trackServerPurchase = asyncHandler(async (req: Request, res: Response) => {
  const { clientId, transactionId, value, currency, items } = req.body;
  if (!clientId || !transactionId || !value || !items) {
    throw new AppError("Missing required parameters (clientId, transactionId, value, items)", 400, "VALIDATION_ERROR");
  }
  const { GA_MEASUREMENT_ID, GA_API_SECRET } = env;
  if (!GA_MEASUREMENT_ID || !GA_API_SECRET) {
    logger.warn("GA_MEASUREMENT_ID or GA_API_SECRET is not configured. Skipping server-side tracking.");
    return res.status(200).json({ success: true, message: "Tracking skipped (not configured)" });
  }
  const payload = {
    client_id: clientId, // Must match the client_id from the frontend (_ga cookie)
    events: [
      {
        name: "purchase",
        params: {
          currency: currency || "USD",
          value,
          transaction_id: transactionId,
          items,
        },
      },
    ],
  };
  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) {
      throw new Error(`GA4 responded with status: ${response.status}`);
    }
    logger.info(`Successfully tracked server-side purchase for transaction: ${transactionId}`);
        
    res.status(200).json({ success: true, message: "Purchase tracked successfully" });
  } catch (error) {
    logger.error("Failed to send GA4 Measurement Protocol event", error);
    // Do not fail the request if tracking fails
    res.status(200).json({ success: true, message: "Tracking failed but request succeeded", error: (error as Error).message });
  }
});

export const getOverviewMetrics = asyncHandler(async (req: Request, res: Response) => {
  const validOrders = await prisma.order.findMany({
    where: {
      status: { notIn: ["CANCELLED", "REFUNDED"] },
      deletedAt: null,
    },
    select: { totalAmount: true }
  });

  const totalOrders = validOrders.length;
  const totalRevenue = validOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const totalCustomers = await prisma.customer.count({ where: { deletedAt: null } });
  const totalProducts = await prisma.product.count({ where: { deletedAt: null } });

  res.status(200).json({
    success: true,
    data: {
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      averageOrderValue
    }
  });
});

export const getRevenueMetrics = asyncHandler(async (req: Request, res: Response) => {
  // Get revenue for the last 6 months
  const now = new Date();
  const trend = [];

  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));

    const result = await prisma.order.aggregate({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
        status: { notIn: ["CANCELLED", "REFUNDED"] },
        deletedAt: null
      },
      _sum: {
        totalAmount: true
      }
    });

    trend.push({
      date: format(monthStart, "MMM yyyy"),
      revenue: Number(result._sum.totalAmount || 0)
    });
  }

  res.status(200).json({
    success: true,
    data: {
      trend
    }
  });
});

export const getOrdersMetrics = asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();
  const trend = [];

  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));

    const result = await prisma.order.count({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
        deletedAt: null
      }
    });

    trend.push({
      date: format(monthStart, "MMM yyyy"),
      orders: result
    });
  }

  res.status(200).json({
    success: true,
    data: {
      trend
    }
  });
});

export const getProductsMetrics = asyncHandler(async (req: Request, res: Response) => {
  // Top 5 products by quantity sold
  const topOrderItems = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        status: { notIn: ["CANCELLED", "REFUNDED"] },
        deletedAt: null
      }
    },
    _sum: {
      quantity: true
    },
    orderBy: {
      _sum: {
        quantity: 'desc'
      }
    },
    take: 5
  });

  const productIds = topOrderItems.map(item => item.productId);
  
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true, price: true }
  });

  const topProducts = topOrderItems.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      id: item.productId,
      name: product?.name || 'Unknown',
      sku: product?.sku || '',
      price: Number(product?.price || 0),
      totalQuantitySold: item._sum.quantity || 0
    };
  });

  res.status(200).json({
    success: true,
    data: {
      topProducts
    }
  });
});

export const getCategoryMetrics = asyncHandler(async (req: Request, res: Response) => {
  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        status: { notIn: ["CANCELLED", "REFUNDED"] },
        deletedAt: null
      }
    },
    include: {
      product: {
        include: {
          category: true
        }
      }
    }
  });

  const categorySales: Record<string, number> = {};

  items.forEach(item => {
    const catName = item.product?.category?.name || 'Uncategorized';
    categorySales[catName] = (categorySales[catName] || 0) + (Number(item.price) * item.quantity);
  });

  const categoryData = Object.entries(categorySales).map(([name, sales]) => ({
    name,
    sales
  })).sort((a, b) => b.sales - a.sales);

  res.status(200).json({
    success: true,
    data: {
      categoryData
    }
  });
});

export const getGa4Metrics = asyncHandler(async (req: Request, res: Response) => {
  const { GA_PROPERTY_ID, GOOGLE_CREDENTIALS_JSON } = env;

  if (!GA_PROPERTY_ID || !GOOGLE_CREDENTIALS_JSON) {
    logger.warn("GA_PROPERTY_ID or GOOGLE_CREDENTIALS_JSON is not configured. Returning empty GA4 data.");
    return res.status(200).json({
      success: true,
      data: {
        activeUsers: 0,
        sessions: 0,
        pageViews: 0,
        conversionRate: 0,
        revenue: 0,
      }
    });
  }

  try {
    let credentials;
    try {
      credentials = JSON.parse(GOOGLE_CREDENTIALS_JSON);
    } catch (e) {
      throw new AppError("Invalid GOOGLE_CREDENTIALS_JSON format", 500, "CONFIG_ERROR");
    }

    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials,
    });

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      dateRanges: [
        {
          startDate: '30daysAgo',
          endDate: 'today',
        },
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'sessionKeyEventsRate' }, // In GA4, conversion rate is sessionKeyEventsRate (previously sessionConversionRate or userConversionRate)
        { name: 'purchaseRevenue' },
      ],
    });

    const rows = response.rows;
    let activeUsers = 0;
    let sessions = 0;
    let pageViews = 0;
    let conversionRate = 0;
    let revenue = 0;

    if (rows && rows.length > 0) {
      const metricValues = rows[0].metricValues;
      if (metricValues) {
        activeUsers = parseInt(metricValues[0].value || '0', 10);
        sessions = parseInt(metricValues[1].value || '0', 10);
        pageViews = parseInt(metricValues[2].value || '0', 10);
        conversionRate = parseFloat(metricValues[3].value || '0') * 100;
        revenue = parseFloat(metricValues[4].value || '0');
      }
    }

    res.status(200).json({
      success: true,
      data: {
        activeUsers,
        sessions,
        pageViews,
        conversionRate,
        revenue,
      }
    });

  } catch (error: any) {
    logger.error("Failed to fetch GA4 metrics", error);
    throw new AppError("Failed to fetch Google Analytics data", 500, "GA4_ERROR");
  }
});
