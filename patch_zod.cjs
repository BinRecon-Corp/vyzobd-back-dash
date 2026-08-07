const fs = require('fs');
const file = 'src/lib/ga4-ecommerce.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'return { isValid: false, errors: (error as ZodError<any>).errors };',
  'return { isValid: false, errors: (error as ZodError<any>).issues };'
).replace(
  'return { isValid: false, errors: (error as ZodError<any>).errors };',
  'return { isValid: false, errors: (error as ZodError<any>).issues };'
);

fs.writeFileSync(file, code);
