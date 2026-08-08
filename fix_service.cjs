const fs = require('fs');
const file = 'src/backend/services/storefront/search.service.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'async getFacets(',
  ', async getFacets('
);

fs.writeFileSync(file, code);
