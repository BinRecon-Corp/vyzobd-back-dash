import test from "node:test";
import assert from "node:assert";
import request from "supertest";
import express from "express";

import storefrontProductRouter from "../product.routes";
import { errorHandler } from "../../../middlewares/errorHandler";
import { storefrontRequestLogger } from "../../../middlewares/storefront/logging.middleware";

import { prisma } from "../../../config/db";
const app = express();
app.use(express.json());

const storefrontRouter = express.Router();
storefrontRouter.use(storefrontRequestLogger);
storefrontRouter.use("/products", storefrontProductRouter);
app.use("/api/storefront/v1", storefrontRouter);

app.use(errorHandler);

const TEST_PREFIX = "test-ga4-";

test("Storefront GA4 Integration Tests", async (t) => {
  let catId = "";
  let brandId = "";
  let p1Id = "";

  t.before(async () => {
    // Cleanup first
    await prisma.productImage.deleteMany({
      where: {
        product: {
          slug: { startsWith: TEST_PREFIX }
        }
      }
    });
    await prisma.product.deleteMany({ where: { slug: { startsWith: TEST_PREFIX } } });
    await prisma.category.deleteMany({ where: { slug: { startsWith: TEST_PREFIX } } });
    await prisma.brand.deleteMany({ where: { slug: { startsWith: TEST_PREFIX } } });

    // Seed test Category
    const cat = await prisma.category.create({
      data: {
        name: "GA4 Cat",
        slug: `${TEST_PREFIX}cat`,
        description: "Cat description text",
        isActive: true
      }
    });
    catId = cat.id;

    // Seed test Brand
    const brand = await prisma.brand.create({
      data: {
        name: "GA4 Brand",
        slug: `${TEST_PREFIX}brand`,
        description: "Brand description text",
        isActive: true
      }
    });
    brandId = brand.id;

    // Seed Product with variant and attributes
    const p1 = await prisma.product.create({
      data: {
        name: "GA4 Product 1",
        slug: `${TEST_PREFIX}prod-1`,
        categoryId: catId,
        brandId: brandId,
        isActive: true,
        status: "Active",
        price: 129.99,
        sku: "GA4-SKU-1",
        condition: "new"
      }
    });
    p1Id = p1.id;

    // Seed a product image
    await prisma.productImage.create({
      data: { productId: p1Id, url: "https://example.com/ga4-image.png", isPrimary: true, sortOrder: 0 }
    });

    // Seed a variant with attributes if needed
    await prisma.productVariant.create({
      data: {
        id: `${TEST_PREFIX}v1`,
        productId: p1Id,
        sku: "GA4-VAR-1",
        price: 129.99,
        isActive: true
      }
    });
  });

  t.after(async () => {
    await prisma.productVariant.deleteMany({ where: { id: { startsWith: TEST_PREFIX } } });
    await prisma.productImage.deleteMany({
      where: {
        product: {
          slug: { startsWith: TEST_PREFIX }
        }
      }
    });
    await prisma.product.deleteMany({ where: { slug: { startsWith: TEST_PREFIX } } });
    await prisma.category.deleteMany({ where: { slug: { startsWith: TEST_PREFIX } } });
    await prisma.brand.deleteMany({ where: { slug: { startsWith: TEST_PREFIX } } });
    await prisma.$disconnect();
  });

  await t.test("Product Listing API: view_item_list payload generation", async () => {
    const res = await request(app).get("/api/storefront/v1/products");
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.ga4);
    assert.strictEqual(res.body.ga4.event, "view_item_list");
    assert.strictEqual(res.body.ga4.ecommerce.item_list_name, "Product List");
    
    const items = res.body.ga4.ecommerce.items;
    assert.ok(Array.isArray(items));
    
    // Find our seeded item
    const targetItem = items.find((i: any) => i.item_name === "GA4 Product 1");
    assert.ok(targetItem);
    assert.strictEqual(targetItem.item_brand, "GA4 Brand");
    assert.strictEqual(targetItem.item_category, "GA4 Cat");
    assert.strictEqual(targetItem.price, 129.99);
    assert.strictEqual(targetItem.currency, "BDT");
    assert.strictEqual(targetItem.item_variant, "GA4-VAR-1");

    // Ensure sensitive properties are never exposed
    assert.strictEqual(targetItem.costPrice, undefined);
    assert.strictEqual(targetItem.vendor, undefined);
    assert.strictEqual(targetItem.vendorId, undefined);
  });

  await t.test("Product Detail API: view_item payload generation", async () => {
    const res = await request(app).get(`/api/storefront/v1/products/${TEST_PREFIX}prod-1`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.ga4);
    assert.strictEqual(res.body.ga4.event, "view_item");
    assert.strictEqual(res.body.ga4.ecommerce.currency, "BDT");
    assert.strictEqual(res.body.ga4.ecommerce.value, 129.99);
    
    const items = res.body.ga4.ecommerce.items;
    assert.ok(Array.isArray(items));
    assert.strictEqual(items.length, 1);
    
    const targetItem = items[0];
    assert.strictEqual(targetItem.item_id, p1Id);
    assert.strictEqual(targetItem.item_name, "GA4 Product 1");
    assert.strictEqual(targetItem.item_brand, "GA4 Brand");
    assert.strictEqual(targetItem.item_category, "GA4 Cat");
    assert.strictEqual(targetItem.price, 129.99);
    assert.strictEqual(targetItem.currency, "BDT");
    assert.strictEqual(targetItem.item_variant, "GA4-VAR-1");

    // Validate no forbidden exposures
    assert.strictEqual(targetItem.costPrice, undefined);
    assert.strictEqual(targetItem.vendor, undefined);
    assert.strictEqual(targetItem.vendorId, undefined);
  });
});
