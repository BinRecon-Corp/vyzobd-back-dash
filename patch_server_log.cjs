const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('storefrontRequestLogger')) {
  code = code.replace(
    'import storefrontBrandRouter from "./src/backend/routes/storefront/brand.routes";',
    'import storefrontBrandRouter from "./src/backend/routes/storefront/brand.routes";\nimport { storefrontRequestLogger } from "./src/backend/middlewares/storefront/logging.middleware";'
  );
  
  code = code.replace(
    'const storefrontRouter = express.Router();',
    'const storefrontRouter = express.Router();\n  storefrontRouter.use(storefrontRequestLogger);'
  );

  fs.writeFileSync(file, code);
}
