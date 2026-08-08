const fs = require('fs');
const file = 'src/backend/dtos/storefront/search.dto.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('SearchFacetsQuerySchema')) {
  code += `\nexport const SearchFacetsQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.enum(["true", "false", "1", "0"]).optional(),
}).refine(data => {
  if (data.minPrice !== undefined && data.maxPrice !== undefined) {
    return data.minPrice <= data.maxPrice;
  }
  return true;
}, {
  message: "minPrice cannot be greater than maxPrice",
  path: ["minPrice"]
});

export type SearchFacetsQueryDTO = z.infer<typeof SearchFacetsQuerySchema>;\n`;
  fs.writeFileSync(file, code);
}
