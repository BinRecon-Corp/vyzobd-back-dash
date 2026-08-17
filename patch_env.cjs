const fs = require('fs');
let content = fs.readFileSync('src/backend/config/env.ts', 'utf8');
content = content.replace(
  'GOOGLE_CREDENTIALS_JSON: z.string().optional(),',
  'GOOGLE_CREDENTIALS_JSON: z.string().optional(),\n  GOOGLE_CLIENT_ID: z.string().optional(),'
);
fs.writeFileSync('src/backend/config/env.ts', content);
