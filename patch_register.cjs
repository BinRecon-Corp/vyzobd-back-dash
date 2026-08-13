const fs = require('fs');
let content = fs.readFileSync('src/backend/controllers/customer-auth.controller.ts', 'utf8');
content = content.replace(
  'passwordHash,',
  'passwordHash,\n          verificationToken: crypto.createHash("sha256").update(crypto.randomBytes(32).toString("hex")).digest("hex"),\n          verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),'
);
fs.writeFileSync('src/backend/controllers/customer-auth.controller.ts', content);
