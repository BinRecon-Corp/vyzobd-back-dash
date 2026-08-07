import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../config/db";
import { GA4MappingService } from "../services/ga4.service";
import { validateGA4EventParams } from "../../lib/ga4-ecommerce";
import { AppError } from "../utils/AppError";

const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
};

const getDefaultCategory = async () => {
  return await prisma.category.upsert({
    where: { slug: "uncategorized" },
    update: {},
    create: { name: "Uncategorized", slug: "uncategorized" },
  });
};

export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    include: {
      category: { include: { parent: true } },
      brand: true,
      inventory: true,
      images: true,
      tags: true,
      variants: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedProducts = products.map(p => ({
    ...p,
    compareAtPrice: p.variants?.[0]?.compareAtPrice || null,
    costPrice: p.variants?.[0]?.costPrice || null,
  }));

  res.status(200).json({ success: true, data: formattedProducts });
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: true,
      brand: true,
      inventory: true,
      images: true,
      tags: true,
      variants: true,
    },
  });

  if (!product) {
    throw new AppError("Product not found", 404, "NOT_FOUND");
  }

  // Generate GA4 payload for this product
  const ga4Payload = GA4MappingService.generateViewItemEvent(product);
  const ga4Validation = validateGA4EventParams(ga4Payload);
  
  res.status(200).json({ 
    success: true, 
    data: {
      ...product,
      compareAtPrice: product.variants?.[0]?.compareAtPrice || null,
      costPrice: product.variants?.[0]?.costPrice || null,
      ga4Event: ga4Validation.isValid ? ga4Validation.data : ga4Payload
    } 
  });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const {
    name, slug, description, shortDescription, 
    categoryId, brandId, 
    metaTitle, metaDescription, ogImage,
    trackInventory, status,
    sku, price, compareAtPrice, costPrice, stock, lowStockThreshold, barcode,
    gtin, mpn, condition,
    image, galleryImages,
    tags
  } = req.body;

  if (!name) {
    throw new AppError("Name is required", 400, "VALIDATION_ERROR");
  }

  let finalCategoryId = categoryId;
  if (!finalCategoryId) {
    const defaultCat = await getDefaultCategory();
    finalCategoryId = defaultCat.id;
  }

  const generatedSlug = slug || generateSlug(name) + "-" + Math.random().toString(36).substring(2, 6);

  const product = await prisma.product.create({
    data: {
      name,
      slug: generatedSlug,
      description,
      shortDescription,
      categoryId: finalCategoryId,
      brandId: brandId || null,
      metaTitle,
      metaDescription,
      ogImage,
      trackInventory: trackInventory !== undefined ? trackInventory : true,
      status: status || "Draft",
      isActive: status === "Active", // Keep in sync for backwards compatibility
      sku,
      price: price ? parseFloat(price) : null,
      barcode,
      gtin,
      mpn,
      condition,
      // Create primary image if provided
      ...(image && {
        images: {
          create: {
            url: image,
            isPrimary: true
          }
        }
      }),
      // Create initial inventory
      ...(trackInventory !== false && stock !== undefined && {
        inventory: {
          create: {
            quantityAvailable: parseInt(stock) || 0,
            quantity: parseInt(stock) || 0,
            lowStockThreshold: parseInt(lowStockThreshold) || 10
          }
        }
      }),
      variants: {
        create: {
          sku: sku || generatedSlug,
          price: price ? parseFloat(price) : 0,
          compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
          costPrice: costPrice ? parseFloat(costPrice) : null,
          barcode: barcode || null,
          isActive: status === "Active"
        }
      }
    },
    include: {
      category: true,
      inventory: true,
      images: true,
      tags: true,
    },
  });

  // Handle gallery images
  if (galleryImages && Array.isArray(galleryImages)) {
    for (const url of galleryImages) {
      await prisma.productImage.create({
        data: {
          url,
          productId: product.id,
          isPrimary: false
        }
      });
    }
  }

  // Handle tags
  if (tags && Array.isArray(tags)) {
    for (const tagId of tags) {
      await prisma.productTag.create({
        data: {
          productId: product.id,
          tagId
        }
      });
    }
  }

  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name, slug, description, shortDescription, 
    categoryId, brandId, 
    metaTitle, metaDescription, ogImage,
    trackInventory, status,
    sku, price, compareAtPrice, costPrice, stock, lowStockThreshold, barcode,
    gtin, mpn, condition,
    image, galleryImages,
    tags
  } = req.body;

  const existingProduct = await prisma.product.findFirst({ 
    where: { id, deletedAt: null },
    include: { variants: true }
  });

  if (!existingProduct) {
    throw new AppError("Product not found", 404, "NOT_FOUND");
  }

  let finalCategoryId = categoryId || existingProduct.categoryId;

  const product = await prisma.product.update({
    where: { id },
    data: {
      name,
      ...(slug && slug !== existingProduct.slug && { slug }),
      description,
      shortDescription,
      categoryId: finalCategoryId,
      brandId: brandId || null,
      metaTitle,
      metaDescription,
      ogImage,
      trackInventory,
      status,
      isActive: status === "Active",
      sku,
      price: price ? parseFloat(price) : undefined,
      barcode,
      gtin,
      mpn,
      condition,
      ...(stock !== undefined && trackInventory !== false && {
        inventory: {
          upsert: {
            create: { 
              quantityAvailable: parseInt(stock), 
              quantity: parseInt(stock),
              lowStockThreshold: parseInt(lowStockThreshold) || 10
            },
            update: { 
              quantityAvailable: parseInt(stock), 
              quantity: parseInt(stock),
              lowStockThreshold: parseInt(lowStockThreshold) || 10
            },
          },
        },
      }),
    }
  });

  // Update Primary Image
  if (image !== undefined) {
    const existingPrimary = await prisma.productImage.findFirst({
      where: { productId: id, isPrimary: true }
    });
    
    if (existingPrimary && image) {
      await prisma.productImage.update({
        where: { id: existingPrimary.id },
        data: { url: image }
      });
    } else if (!existingPrimary && image) {
      await prisma.productImage.create({
        data: { url: image, productId: id, isPrimary: true }
      });
    } else if (existingPrimary && !image) {
      await prisma.productImage.delete({ where: { id: existingPrimary.id } });
    }
  }

  // Update tags (simplified: delete all and recreate)
  if (tags && Array.isArray(tags)) {
    await prisma.productTag.deleteMany({ where: { productId: id } });
    for (const tagId of tags) {
      await prisma.productTag.create({
        data: { productId: id, tagId }
      });
    }
  }

  const defaultVariant = existingProduct.variants?.[0];
  if (defaultVariant) {
    await prisma.productVariant.update({
      where: { id: defaultVariant.id },
      data: {
        compareAtPrice: compareAtPrice !== undefined ? (compareAtPrice ? parseFloat(compareAtPrice) : null) : undefined,
        costPrice: costPrice !== undefined ? (costPrice ? parseFloat(costPrice) : null) : undefined,
        price: price !== undefined ? (price ? parseFloat(price) : null) : undefined,
        sku: sku || undefined,
        barcode: barcode || undefined,
      }
    });
  } else if (compareAtPrice || costPrice) {
    await prisma.productVariant.create({
      data: {
        productId: id,
        sku: sku || existingProduct.slug,
        price: price ? parseFloat(price) : 0,
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        barcode: barcode || null,
      }
    });
  }

  const updatedProduct = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      inventory: true,
      images: true,
      tags: true,
      variants: true,
    },
  });

  const responseData = {
    ...updatedProduct,
    compareAtPrice: updatedProduct?.variants?.[0]?.compareAtPrice || null,
    costPrice: updatedProduct?.variants?.[0]?.costPrice || null,
  };

  res.status(200).json({ success: true, data: responseData });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await prisma.product.findFirst({ where: { id, deletedAt: null } });

  if (!product) {
    throw new AppError("Product not found", 404, "NOT_FOUND");
  }

  const deleteDate = new Date();

  await prisma.$transaction([
    prisma.product.update({
      where: { id },
      data: { deletedAt: deleteDate, isActive: false, status: "Archived" },
    }),
    prisma.productVariant.updateMany({
      where: { productId: id, deletedAt: null },
      data: { deletedAt: deleteDate, isActive: false },
    }),
    prisma.productImage.updateMany({
      where: { productId: id, deletedAt: null },
      data: { deletedAt: deleteDate },
    }),
    prisma.inventory.updateMany({
      where: { productId: id, deletedAt: null },
      data: { deletedAt: deleteDate },
    }),
  ]);

  res.status(200).json({ success: true, message: "Product deleted successfully" });
});
