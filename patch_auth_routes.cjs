const fs = require('fs');
let content = fs.readFileSync('src/backend/routes/customer-auth.routes.ts', 'utf8');

content = content.replace(
  'import { register, login, logout, googleAuth, facebookAuth } from "../controllers/customer-auth.controller";',
  'import { register, login, logout, googleAuth, facebookAuth, forgotPassword, resetPassword, verifyEmail } from "../controllers/customer-auth.controller";'
);

content = content.replace(
  'import { customerRegisterSchema, customerLoginSchema } from "../validators/customer-auth.validator";',
  'import { customerRegisterSchema, customerLoginSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema } from "../validators/customer-auth.validator";'
);

content = content.replace(
  'router.post("/facebook", facebookAuth);',
  'router.post("/facebook", facebookAuth);\nrouter.post("/forgot-password", validateBody(forgotPasswordSchema), forgotPassword);\nrouter.post("/reset-password", validateBody(resetPasswordSchema), resetPassword);\nrouter.post("/verify-email", validateBody(verifyEmailSchema), verifyEmail);'
);

fs.writeFileSync('src/backend/routes/customer-auth.routes.ts', content);
