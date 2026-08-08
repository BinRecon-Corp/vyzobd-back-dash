const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'import storefrontSearchRouter from "./src/backend/routes/storefront/search.routes";',
  'import storefrontSearchRouter from "./src/backend/routes/storefront/search.routes";\nimport storefrontMerchantRouter from "./src/backend/routes/storefront/merchant.routes";'
);

code = code.replace(
  'storefrontRouter.use("/search", storefrontSearchRouter);',
  'storefrontRouter.use("/search", storefrontSearchRouter);\n  storefrontRouter.use("/merchant", storefrontMerchantRouter);'
);

fs.writeFileSync(file, code);
