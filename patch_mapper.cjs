const fs = require('fs');
const file = 'src/backend/dtos/storefront/mappers.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'export function mapBrandToStorefrontDTO(brand: any): StorefrontBrand {',
  'export function mapBrandToStorefrontDTO(brand: any): StorefrontBrand & { website?: string | null } {'
);

code = code.replace(
  '    ogImage: brand.logoUrl || null,\n  };',
  '    ogImage: brand.logoUrl || null,\n    website: brand.website || null,\n  };'
);

fs.writeFileSync(file, code);
