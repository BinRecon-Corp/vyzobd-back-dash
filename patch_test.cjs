const fs = require('fs');
const file = 'src/backend/routes/storefront/__tests__/integration.test.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'const slugs = res.body.data.data.map((b: any) => b.slug); // paginated',
  'const slugs = res.body.data.map((b: any) => b.slug);'
);

fs.writeFileSync(file, code);
