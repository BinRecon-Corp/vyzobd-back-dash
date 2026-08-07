const fs = require('fs');
const file = 'src/backend/controllers/product.controller.ts';
let code = fs.readFileSync(file, 'utf8');

// Add import
if (!code.includes('GA4MappingService')) {
  code = code.replace(
    'import { prisma } from "../config/db";',
    'import { prisma } from "../config/db";\nimport { GA4MappingService } from "../services/ga4.service";\nimport { validateGA4EventParams } from "../../lib/ga4-ecommerce";'
  );
}

// Modify getProductById
code = code.replace(
  '  res.status(200).json({ success: true, data: product });',
  `  // Generate GA4 payload for this product
  const ga4Payload = GA4MappingService.generateViewItemEvent(product);
  const ga4Validation = validateGA4EventParams(ga4Payload);
  
  res.status(200).json({ 
    success: true, 
    data: {
      ...product,
      ga4Event: ga4Validation.isValid ? ga4Validation.data : ga4Payload
    } 
  });`
);

fs.writeFileSync(file, code);
