const fs = require('fs');
const file = 'src/backend/controllers/storefront/search.controller.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'import { SearchQuerySchema } from "../../dtos/storefront/search.dto";',
  'import { SearchQuerySchema, SearchFacetsQuerySchema } from "../../dtos/storefront/search.dto";\nimport { logger } from "../../config/logger";'
);

if (!code.includes('export const getFacets')) {
  code += `\nexport const getFacets = asyncHandler(async (req: Request, res: Response) => {
  const query = SearchFacetsQuerySchema.parse(req.query);

  let inStockBool: boolean | undefined = undefined;
  if (query.inStock !== undefined) {
    inStockBool = query.inStock === "true" || query.inStock === "1";
  }

  const result = await storefrontSearchService.getFacets({
    q: query.q,
    category: query.category,
    brand: query.brand,
    minPrice: query.minPrice,
    maxPrice: query.maxPrice,
    inStock: inStockBool,
  });

  logger.info(\`Facets aggregation executed in \${result.duration}ms\`);

  res.json({
    success: true,
    data: {
      categories: result.categories,
      brands: result.brands,
      priceRange: result.priceRange,
      availability: result.availability
    }
  });
});\n`;
  fs.writeFileSync(file, code);
}
