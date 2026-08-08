const fs = require('fs');
const file = 'src/backend/config/logger.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'winston.format.printf(({ level, message, timestamp, stack }) => {',
  'winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {'
);
code = code.replace(
  'return `${timestamp} ${level}: ${message}`;',
  'const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";\n          return `${timestamp} ${level}: ${message} ${metaStr}`.trim();'
);

fs.writeFileSync(file, code);
