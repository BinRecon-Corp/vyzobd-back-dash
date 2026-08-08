const fs = require('fs');
const file = 'src/backend/middlewares/storefront/logging.middleware.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'path: req.originalUrl,',
  'path: req.originalUrl.split("?")[0],'
);

fs.writeFileSync(file, code);
