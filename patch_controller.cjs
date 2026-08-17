const fs = require('fs');
let content = fs.readFileSync('src/backend/controllers/customer-auth.controller.ts', 'utf8');
content = content.replace(/\.\.\/\.\.\/config\/db/g, '../config/db');
content = content.replace(/\.\.\/\.\.\/utils\/AppError/g, '../utils/AppError');
content = content.replace(/\.\.\/\.\.\/utils\/customerJwt/g, '../utils/customerJwt');
content = content.replace(/\.\.\/\.\.\/config\/env/g, '../config/env');
content = content.replace(/\.\.\/\.\.\/middlewares\/customerAuth/g, '../middlewares/customerAuth');
fs.writeFileSync('src/backend/controllers/customer-auth.controller.ts', content);
