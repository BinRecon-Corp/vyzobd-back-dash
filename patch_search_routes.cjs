const fs = require('fs');
const file = 'src/backend/routes/storefront/search.routes.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('getFacets')) {
  code = code.replace(
    'import { searchProducts } from "../../controllers/storefront/search.controller";',
    'import { searchProducts, getFacets } from "../../controllers/storefront/search.controller";'
  );

  code = code.replace(
    'router.get("/", searchProducts);',
    'router.get("/facets", getFacets);\nrouter.get("/", searchProducts);'
  );

  fs.writeFileSync(file, code);
}
