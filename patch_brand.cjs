const fs = require('fs');
const file = 'src/backend/dtos/storefront/mappers.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'seoTitle: brand.name,',
  'seoTitle: brand.seoTitle || brand.name,'
);
code = code.replace(
  'seoDescription: brand.description || null,',
  'seoDescription: brand.seoDescription || brand.description || null,'
);

fs.writeFileSync(file, code);
