const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const category = await prisma.category.create({
    data: { name: 'Test Category', slug: 'test-category-' + Date.now(), isActive: true }
  });

  const product = await prisma.product.create({
    data: {
      name: 'Test Product ' + Date.now(),
      slug: 'test-product-' + Date.now(),
      description: 'A product for testing',
      price: 100.00,
      categoryId: category.id,
      trackInventory: true,
      isActive: true,
      status: 'Active',
      inventory: {
        create: {
          quantityAvailable: 50,
          quantityReserved: 0
        }
      }
    }
  });

  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      sku: 'TEST-SKU-' + Date.now(),
      price: 110.00,
      isActive: true,
      inventories: {
        create: {
          quantityAvailable: 20,
          quantityReserved: 0
        }
      }
    }
  });

  console.log(JSON.stringify({ productId: product.id, variantId: variant.id }));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
