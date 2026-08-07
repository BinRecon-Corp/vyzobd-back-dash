const fs = require('fs');
const file = 'src/backend/controllers/product.controller.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'category: true,',
  'category: { include: { parent: true } },'
);

fs.writeFileSync(file, code);
