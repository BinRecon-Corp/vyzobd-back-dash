const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace(
  'import customerRouter from "./src/backend/routes/customer.routes";',
  'import customerAuthRouter from "./src/backend/routes/customer-auth.routes";\nimport customerRouter from "./src/backend/routes/customer.routes";'
);
content = content.replace(
  'apiRouter.use("/customers", customerRouter);',
  'apiRouter.use("/customer/auth", customerAuthRouter);\n  apiRouter.use("/customers", customerRouter);'
);
fs.writeFileSync('server.ts', content);
