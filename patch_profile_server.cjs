const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  'import customerAuthRouter from "./src/backend/routes/customer-auth.routes";',
  'import customerAuthRouter from "./src/backend/routes/customer-auth.routes";\nimport customerProfileRouter from "./src/backend/routes/customer-profile.routes";'
);

content = content.replace(
  'apiRouter.use("/customer/auth", customerAuthRouter);',
  'apiRouter.use("/customer/auth", customerAuthRouter);\n  apiRouter.use("/customer", customerProfileRouter);'
);

fs.writeFileSync('server.ts', content);
