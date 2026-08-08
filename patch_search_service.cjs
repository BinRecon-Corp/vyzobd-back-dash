const fs = require('fs');
const file = 'src/backend/services/storefront/search.service.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('async getFacets(')) {
  const facetMethod = `
  async getFacets(options: Omit<SearchProductsOptions, 'page' | 'limit' | 'sort'>) {
    const { q, category, brand, minPrice, maxPrice, inStock } = options;

    const andConditions: Prisma.ProductWhereInput[] = [
      { isActive: true },
      { status: "Active" },
      { deletedAt: null }
    ];

    if (q) {
      andConditions.push({
        OR: [
          { name: { contains: q } },
          { slug: { contains: q } },
          { shortDescription: { contains: q } },
          { description: { contains: q } },
        ]
      });
    }

    if (category) {
      andConditions.push({ category: { slug: category, isActive: true, deletedAt: null } });
    }

    if (brand) {
      andConditions.push({ brand: { slug: brand, isActive: true, deletedAt: null } });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: any = {};
      if (minPrice !== undefined) priceFilter.gte = minPrice;
      if (maxPrice !== undefined) priceFilter.lte = maxPrice;
      andConditions.push({ price: priceFilter });
    }

    if (inStock) {
      andConditions.push({
        OR: [
          { inventory: { quantityAvailable: { gt: 0 } } },
          { inventory: { quantity: { gt: 0 } } },
          { variants: { some: { inventories: { some: { quantityAvailable: { gt: 0 } } } } } },
          { variants: { some: { inventories: { some: { quantity: { gt: 0 } } } } } }
        ]
      });
    }

    const where: Prisma.ProductWhereInput = { AND: andConditions };

    const inStockWhere: Prisma.ProductWhereInput = {
      ...where,
      OR: [
        { inventory: { quantityAvailable: { gt: 0 } } },
        { inventory: { quantity: { gt: 0 } } },
        { variants: { some: { inventories: { some: { quantityAvailable: { gt: 0 } } } } } },
        { variants: { some: { inventories: { some: { quantity: { gt: 0 } } } } } }
      ]
    };

    const startTime = Date.now();

    const [
      categoryGroups,
      brandGroups,
      priceAgg,
      inStockCount,
      totalCount
    ] = await Promise.all([
      prisma.product.groupBy({
        by: ['categoryId'],
        where,
        _count: { id: true }
      }),
      prisma.product.groupBy({
        by: ['brandId'],
        where: { ...where, brandId: { not: null } },
        _count: { id: true }
      }),
      prisma.product.aggregate({
        where,
        _min: { price: true },
        _max: { price: true }
      }),
      prisma.product.count({ where: inStockWhere }),
      prisma.product.count({ where })
    ]);

    const outOfStockCount = totalCount - inStockCount;

    const categoryIds = categoryGroups.map(g => g.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } }
    });

    const brandIds = brandGroups.map(g => g.brandId as string).filter(Boolean);
    const brands = await prisma.brand.findMany({
      where: { id: { in: brandIds } }
    });

    const categoryFacets = categoryGroups.map(g => {
      const cat = categories.find(c => c.id === g.categoryId);
      if (!cat) return null;
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        count: g._count.id
      };
    }).filter(Boolean);

    const brandFacets = brandGroups.map(g => {
      const b = brands.find(b => b.id === g.brandId);
      if (!b) return null;
      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        count: g._count.id
      };
    }).filter(Boolean);

    const duration = Date.now() - startTime;

    return {
      duration,
      categories: categoryFacets,
      brands: brandFacets,
      priceRange: {
        min: priceAgg._min.price ? Number(priceAgg._min.price) : 0,
        max: priceAgg._max.price ? Number(priceAgg._max.price) : 0
      },
      availability: {
        inStock: inStockCount,
        outOfStock: outOfStockCount
      }
    };
  }
};`;

  code = code.replace(/};\s*$/, facetMethod);
  fs.writeFileSync(file, code);
}
