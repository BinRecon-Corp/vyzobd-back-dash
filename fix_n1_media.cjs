const fs = require('fs');

let content = fs.readFileSync('src/backend/services/product-media.service.ts', 'utf8');

const targetFunctionRegex = /static async migrateExistingProductMedia\(\) \{[\s\S]*?\} catch \(err\) \{/m;

const replacement = `static async migrateExistingProductMedia() {
    try {
      const productsWithoutImages = await prisma.product.findMany({
        where: { deletedAt: null },
        include: { images: true },
      });

      const toCreate = [];
      const toUpdate = [];

      for (const product of productsWithoutImages) {
        if (product.images.length === 0 && product.ogImage) {
          toCreate.push({
            productId: product.id,
            imageUrl: product.ogImage,
            url: product.ogImage,
            isPrimary: true,
            sortOrder: 0,
          });
        } else {
          for (const img of product.images) {
            if (!img.imageUrl || img.imageUrl === "") {
              toUpdate.push({
                id: img.id,
                imageUrl: img.url || "",
              });
            }
          }
        }
      }

      if (toCreate.length > 0) {
        await prisma.productImage.createMany({ data: toCreate });
      }

      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map(update => 
            prisma.productImage.update({
              where: { id: update.id },
              data: { imageUrl: update.imageUrl },
            })
          )
        );
      }
    } catch (err) {`;

content = content.replace(targetFunctionRegex, replacement);
fs.writeFileSync('src/backend/services/product-media.service.ts', content, 'utf8');

