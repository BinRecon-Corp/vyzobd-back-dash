const fs = require('fs');
let content = fs.readFileSync('src/backend/controllers/customer-profile.controller.ts', 'utf8');
content = content.replace(
  'const { firstName, lastName, phone } = req.body;',
  'const { firstName, lastName, phone, avatarUrl } = req.body;'
);
content = content.replace(
  '...(phone !== undefined && { phone }),',
  '...(phone !== undefined && { phone }),\n        ...(avatarUrl !== undefined && { avatarUrl }),'
);
fs.writeFileSync('src/backend/controllers/customer-profile.controller.ts', content);
