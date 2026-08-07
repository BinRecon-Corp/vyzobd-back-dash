const fs = require('fs');
const file = 'src/backend/routes/analytics.routes.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'getCategoryMetrics,',
  'getCategoryMetrics,\n  getBrandMetrics,'
);

code = code.replace(
  'router.get("/ga4", getGa4Metrics);',
  'router.get("/brands", getBrandMetrics);\nrouter.get("/ga4", getGa4Metrics);'
);

fs.writeFileSync(file, code);
