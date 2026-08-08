const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'import storefrontBrandRouter from "./src/backend/routes/storefront/brand.routes";',
  'import storefrontBrandRouter from "./src/backend/routes/storefront/brand.routes";\nimport storefrontSearchRouter from "./src/backend/routes/storefront/search.routes";'
);

code = code.replace(
  'storefrontRouter.use("/brands", storefrontBrandRouter);',
  'storefrontRouter.use("/brands", storefrontBrandRouter);\n  storefrontRouter.use("/search", storefrontSearchRouter);'
);

fs.writeFileSync(file, code);
