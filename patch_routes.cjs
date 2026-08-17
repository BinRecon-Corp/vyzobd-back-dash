const fs = require('fs');
let content = fs.readFileSync('src/backend/routes/customer-auth.routes.ts', 'utf8');

content = content.replace(
  'import { register, login, logout } from "../controllers/customer-auth.controller";',
  'import { register, login, logout, googleAuth } from "../controllers/customer-auth.controller";'
);

content = content.replace(
  'router.post("/logout", requireCustomerAuth, logout);',
  'router.post("/logout", requireCustomerAuth, logout);\nrouter.post("/google", googleAuth);'
);

fs.writeFileSync('src/backend/routes/customer-auth.routes.ts', content);
