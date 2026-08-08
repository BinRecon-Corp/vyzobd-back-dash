const fs = require('fs');
const file = 'src/backend/routes/storefront/brand.routes.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'import { getBrands, getBrandBySlug } from "../../controllers/storefront/brand.controller";',
  'import { getBrands, getBrandBySlug } from "../../controllers/storefront/brand.controller";\nimport { validateBrandListQuery } from "../../middlewares/storefront/validation.middleware";'
);

code = code.replace(
  'router.get("/", getBrands);',
  'router.get("/", validateBrandListQuery, getBrands);'
);

fs.writeFileSync(file, code);
