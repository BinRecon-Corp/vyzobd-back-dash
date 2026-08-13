const fs = require('fs');
let data = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
data.exclude = ["dist", "node_modules"];
fs.writeFileSync('tsconfig.json', JSON.stringify(data, null, 2));
