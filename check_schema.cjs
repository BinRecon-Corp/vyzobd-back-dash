const fs = require('fs');

const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

const models = schema.split('model ').slice(1);
const missingIndexes = [];

models.forEach(modelStr => {
  const modelName = modelStr.split('{')[0].trim();
  const fields = modelStr.match(/.*@relation\s*\(.*fields:\s*\[(.*?)\]/g);
  
  if (fields) {
    fields.forEach(fieldDef => {
      const fieldNames = fieldDef.match(/fields:\s*\[(.*?)\]/)[1].split(',').map(s => s.trim());
      // Check if there is an index for this combination or just the first field
      
      fieldNames.forEach(fieldName => {
         // simple check if @@index([fieldName]) exists in the model
         if (!modelStr.includes(`@@index([${fieldName}])`) && !modelStr.includes(`@@index([${fieldName},`) && !modelStr.includes(`@unique`)) {
             // Let's also check if the field itself has @unique
             const fieldLineRegex = new RegExp(`^\\s*${fieldName}\\s+.*?@unique`, 'm');
             if (!fieldLineRegex.test(modelStr)) {
                 missingIndexes.push({ model: modelName, field: fieldName });
             }
         }
      })
    });
  }
});

console.log(missingIndexes);
