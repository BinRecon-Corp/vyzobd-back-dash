const fs = require('fs');
const file = 'src/pages/Analytics.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'const categorySales = categories?.categoryData || [];',
  'const categorySales = categories?.categoryData || [];\n  const brandSales = brands || [];'
);

fs.writeFileSync(file, code);
