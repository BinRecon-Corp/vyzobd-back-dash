const fs = require('fs');
const file = 'src/backend/routes/storefront/product.routes.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'import { getProducts, getProductBySlug } from "../../controllers/storefront/product.controller";',
  'import { getProducts, getProductBySlug } from "../../controllers/storefront/product.controller";\nimport { validateProductListQuery } from "../../middlewares/storefront/validation.middleware";'
);

code = code.replace(
  'router.get("/", getProducts);',
  'router.get("/", validateProductListQuery, getProducts);'
);

fs.writeFileSync(file, code);
