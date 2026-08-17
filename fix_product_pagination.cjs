const fs = require('fs');
let code = fs.readFileSync('src/backend/controllers/product.controller.ts', 'utf8');

const replacement = `export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 50, search = "", categoryId = "", brandId = "", status = "" } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const where: any = { deletedAt: null };
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: "insensitive" } },
      { sku: { contains: search as string, mode: "insensitive" } }
    ];
  }
  if (categoryId) where.categoryId = categoryId as string;
  if (brandId) where.brandId = brandId as string;
  if (status) where.status = status as string;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        category: { include: { parent: true } },
        brand: true,
        inventory: true,
        images: { orderBy: { sortOrder: 'asc' } },
        tags: true,
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where })
  ]);

  const formattedProducts = products.map(p => {
    const formatted = ProductMediaService.formatProductMedia(p);
    return {
      ...formatted,
      compareAtPrice: p.variants?.[0]?.compareAtPrice || null,
      costPrice: p.variants?.[0]?.costPrice || null,
    };
  });

  res.status(200).json({
    success: true,
    data: formattedProducts,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});`;

code = code.replace(/export const getAllProducts = asyncHandler\(async \(req: Request, res: Response\) => \{[\s\S]*?res\.status\(200\)\.json\(\{ success: true, data: formattedProducts \}\);\n\}\);/, replacement);

fs.writeFileSync('src/backend/controllers/product.controller.ts', code, 'utf8');
