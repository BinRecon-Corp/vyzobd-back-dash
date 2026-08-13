const fs = require('fs');
let content = fs.readFileSync('src/backend/routes/customer-profile.routes.ts', 'utf8');

content = content.replace(
  'deleteAddress\n} from "../controllers/customer-profile.controller";',
  'deleteAddress,\n  getPreferences,\n  updatePreferences\n} from "../controllers/customer-profile.controller";'
);

content = content.replace(
  'addressSchema \n} from "../validators/customer-profile.validator";',
  'addressSchema,\n  preferencesSchema\n} from "../validators/customer-profile.validator";'
);

content = content.replace(
  'router.put("/change-password", validateBody(changePasswordSchema), changePassword);',
  'router.put("/change-password", validateBody(changePasswordSchema), changePassword);\n\n// Preferences\nrouter.get("/preferences", getPreferences);\nrouter.put("/preferences", validateBody(preferencesSchema), updatePreferences);'
);

fs.writeFileSync('src/backend/routes/customer-profile.routes.ts', content);
