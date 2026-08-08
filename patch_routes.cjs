const fs = require('fs');
const file = 'src/backend/routes/storefront/brand.routes.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'import { getBrands } from "../../controllers/storefront/brand.controller";',
  'import { getBrands, getBrandBySlug } from "../../controllers/storefront/brand.controller";'
);
code = code.replace(
  'export default router;',
  'router.get("/:slug", getBrandBySlug);\n\nexport default router;'
);

fs.writeFileSync(file, code);
