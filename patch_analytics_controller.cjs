const fs = require('fs');
const file = 'src/backend/controllers/analytics.controller.ts';
let code = fs.readFileSync(file, 'utf8');

const brandMetricsFunc = `
export const getBrandMetrics = asyncHandler(async (req: Request, res: Response) => {
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
          brand: true
        }
      }
    }
  });

  const brandSales: Record<string, number> = {};
  items.forEach(item => {
    const brandName = item.product?.brand?.name || 'Unbranded';
    brandSales[brandName] = (brandSales[brandName] || 0) + (Number(item.price) * item.quantity);
  });

  const brandData = Object.entries(brandSales).map(([name, sales]) => ({
    name,
    sales
  })).sort((a, b) => b.sales - a.sales);

  res.status(200).json({
    success: true,
    data: {
      brandData
    }
  });
});
`;

code += brandMetricsFunc;

fs.writeFileSync(file, code);
