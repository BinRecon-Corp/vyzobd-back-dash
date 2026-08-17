import sys

with open('src/backend/services/storefront/account.service.ts', 'r') as f:
    content = f.read()

target = """    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        addresses: {
          where: { isDefault: true },
          take: 1,
        },
        _count: {
          select: {
            orders: true,
          }
        },
        wishlist: {
          include: {
            _count: {
              select: { items: true }
            }
          }
        }
      }
    });

    const recentSession = await prisma.customerRefreshToken.findFirst({
      where: { customerId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      }
    });

    return {
      profile: {
        id: customer?.id,
        firstName: customer?.firstName,
        lastName: customer?.lastName,
        email: customer?.email,
        phone: customer?.phone,
        emailVerified: customer?.emailVerified,
        lastLoginAt: customer?.lastLoginAt,
        createdAt: customer?.createdAt,
      },
      defaultAddress: customer?.addresses[0] || null,
      stats: {
        orders: customer?._count.orders || 0,
        wishlist: customer?.wishlist?._count.items || 0,
      },
      recentSession,
    };
  }"""

replacement = """    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        addresses: {
          where: { isDefault: true },
          take: 1,
        },
        _count: {
          select: {
            orders: { where: { deletedAt: null } },
          }
        },
        wishlist: {
          include: {
            _count: {
              select: { items: true }
            }
          }
        }
      }
    });

    const recentSession = await prisma.customerRefreshToken.findFirst({
      where: { customerId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      }
    });

    const [recentOrders, recentActivity, orderStatusCounts, totalSpendingAgg] = await Promise.all([
      prisma.order.findMany({
        where: { customerId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true }
      }),
      prisma.customerActivity.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, type: true, description: true, ipAddress: true, createdAt: true }
      }),
      prisma.order.groupBy({
        by: ['status'],
        where: { customerId, deletedAt: null },
        _count: { id: true }
      }),
      prisma.order.aggregate({
        where: { customerId, deletedAt: null, status: 'Delivered', paymentStatus: 'PAID' },
        _sum: { totalAmount: true }
      })
    ]);

    const orderStatusMap: Record<string, number> = {};
    orderStatusCounts.forEach(c => { orderStatusMap[c.status] = c._count.id; });

    return {
      profile: {
        id: customer?.id,
        firstName: customer?.firstName,
        lastName: customer?.lastName,
        email: customer?.email,
        phone: customer?.phone,
        avatarUrl: customer?.avatarUrl,
        emailVerified: customer?.emailVerified,
        lastLoginAt: customer?.lastLoginAt,
        createdAt: customer?.createdAt,
      },
      defaultAddress: customer?.addresses[0] || null,
      stats: {
        orders: customer?._count.orders || 0,
        wishlist: customer?.wishlist?._count.items || 0,
        totalSpending: totalSpendingAgg._sum.totalAmount ? Number(totalSpendingAgg._sum.totalAmount) : 0,
        ordersByStatus: orderStatusMap,
      },
      recentOrders,
      recentActivity,
      recentSession,
    };
  }"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/backend/services/storefront/account.service.ts', 'w') as f:
        f.write(content)
    print("dashboard updated successfully")
else:
    print("dashboard target not found")
