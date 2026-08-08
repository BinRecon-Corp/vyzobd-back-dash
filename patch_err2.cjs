const fs = require('fs');
const file = 'src/backend/middlewares/errorHandler.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'details: (err as any).errors.map((e: any) => ({',
  'details: ((err as any).errors || (err as any).issues || []).map((e: any) => ({'
);

fs.writeFileSync(file, code);
