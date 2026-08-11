const fs = require('fs');
let code = fs.readFileSync('src/backend/controllers/product.controller.ts', 'utf8');

code = code.replace(/await prisma\.productImage\.createMany\(\{ data: galleryImages\.map\(url => \(\{ url, imageUrl: url, productId: product\.id, isPrimary: false \}\)\) \}\);\n\s+\/\/\n\s+await prisma\.productImage\.create\(\{\n\s+data: \{\n\s+url,\n\s+productId: product\.id,\n\s+isPrimary: false\n\s+\}\n\s+\}\);\n\s+\}/g, 'await prisma.productImage.createMany({ data: galleryImages.map(url => ({ url, imageUrl: url, productId: product.id, isPrimary: false })) });');

code = code.replace(/await prisma\.productTag\.createMany\(\{ data: tags\.map\(tagId => \(\{ productId: product\.id, tagId \}\)\) \}\);\n\s+\/\/\n\s+await prisma\.productTag\.create\(\{\n\s+data: \{\n\s+productId: product\.id,\n\s+tagId\n\s+\}\n\s+\}\);\n\s+\}/g, 'await prisma.productTag.createMany({ data: tags.map(tagId => ({ productId: product.id, tagId })) });');

code = code.replace(/await prisma\.productTag\.createMany\(\{ data: tags\.map\(tagId => \(\{ productId: product\.id, tagId \}\)\) \}\);\n\s+\/\/\n\s+await prisma\.productTag\.create\(\{\n\s+data: \{ productId: id, tagId \}\n\s+\}\);\n\s+\}/g, 'await prisma.productTag.createMany({ data: tags.map(tagId => ({ productId: id, tagId })) });');

fs.writeFileSync('src/backend/controllers/product.controller.ts', code, 'utf8');
