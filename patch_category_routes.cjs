const fs = require('fs');
const file = 'src/backend/routes/storefront/category.routes.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'import { getCategories, getCategoryBySlug } from "../../controllers/storefront/category.controller";',
  'import { getCategories, getCategoryBySlug } from "../../controllers/storefront/category.controller";\nimport { validateCategoryListQuery } from "../../middlewares/storefront/validation.middleware";'
);

code = code.replace(
  'router.get("/", getCategories);',
  'router.get("/", validateCategoryListQuery, getCategories);'
);

fs.writeFileSync(file, code);
