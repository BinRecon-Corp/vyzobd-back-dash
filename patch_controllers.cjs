const fs = require('fs');

function patchFile(file, searchStr, replaceStr) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(searchStr, replaceStr);
  fs.writeFileSync(file, code);
}

patchFile(
  'src/backend/controllers/storefront/product.controller.ts',
  'return res.status(404).json({ error: "Product not found" });',
  'return res.status(404).json({ success: false, message: "Product not found" });'
);

patchFile(
  'src/backend/controllers/storefront/category.controller.ts',
  'return res.status(404).json({ success: false, error: "Category not found" });',
  'return res.status(404).json({ success: false, message: "Category not found" });'
);

patchFile(
  'src/backend/controllers/storefront/brand.controller.ts',
  'return res.status(404).json({ success: false, error: "Brand not found" });',
  'return res.status(404).json({ success: false, message: "Brand not found" });'
);
