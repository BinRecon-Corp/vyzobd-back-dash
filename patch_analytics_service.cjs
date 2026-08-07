const fs = require('fs');
const file = 'src/services/analytics.service.ts';
let code = fs.readFileSync(file, 'utf8');

code += `\nexport const getBrandMetrics = async () => {\n  const { data } = await api.get("/analytics/brands");\n  return data.data.brandData;\n};\n`;

fs.writeFileSync(file, code);
