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
  res.status(200).json({ success: true, data: products });
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
      })
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
    image, galleryImages,
    tags
  } = req.body;

  const existingProduct = await prisma.product.findFirst({ where: { id, deletedAt: null } });

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

  const updatedProduct = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      inventory: true,
      images: true,
      tags: true,
    },
  });

  res.status(200).json({ success: true, data: updatedProduct });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await prisma.product.findFirst({ where: { id, deletedAt: null } });

  if (!product) {
    throw new AppError("Product not found", 404, "NOT_FOUND");
  }

  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  res.status(200).json({ success: true, message: "Product deleted successfully" });
});
