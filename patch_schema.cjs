const fs = require('fs');
let content = fs.readFileSync('src/backend/validators/customer-profile.validator.ts', 'utf8');
content = content.replace(
  'phone: z.string().optional(),',
  'phone: z.string().optional(),\n  avatarUrl: z.string().url("Invalid image URL").optional(),'
);
fs.writeFileSync('src/backend/validators/customer-profile.validator.ts', content);
