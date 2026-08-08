const fs = require('fs');
const file = 'src/backend/config/logger.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {',
  'winston.format.printf(({ level, message, timestamp, stack }) => {'
);
code = code.replace(
  'const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";\n          return `${timestamp} ${level}: ${message} ${metaStr}`.trim();',
  'return `${timestamp} ${level}: ${message}`;'
);

fs.writeFileSync(file, code);
