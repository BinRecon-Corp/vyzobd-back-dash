import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";

// Helper to generate slug
const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
};

// Ensure default category exists
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
      category: true,
      brand: true,
      inventory: true,
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
    },
  });

  if (!product) {
    throw new AppError("Product not found", 404, "NOT_FOUND");
  }

  res.status(200).json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const { name, sku, description, price, stock, categoryId, brandId, status } = req.body;

  if (!name || !sku || price === undefined) {
    throw new AppError("Name, SKU, and price are required", 400, "VALIDATION_ERROR");
  }

  let finalCategoryId = categoryId;
  if (!finalCategoryId) {
    const defaultCat = await getDefaultCategory();
    finalCategoryId = defaultCat.id;
  }

  const slug = generateSlug(name) + "-" + Math.random().toString(36).substring(2, 6);

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      sku,
      description,
      price: parseFloat(price),
      categoryId: finalCategoryId,
      brandId: brandId || null,
      isActive: status === "Active",
      inventory: {
        create: {
          quantity: parseInt(stock) || 0,
        },
      },
    },
    include: {
      category: true,
      inventory: true,
    },
  });

  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, sku, description, price, stock, categoryId, brandId, status } = req.body;

  const product = await prisma.product.findFirst({ where: { id, deletedAt: null } });
  if (!product) {
    throw new AppError("Product not found", 404, "NOT_FOUND");
  }

  let finalCategoryId = categoryId || product.categoryId;

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      name,
      ...(name && { slug: generateSlug(name) + "-" + Math.random().toString(36).substring(2, 6) }),
      sku,
      description,
      price: price !== undefined ? parseFloat(price) : undefined,
      categoryId: finalCategoryId,
      brandId: brandId || null,
      isActive: status === "Active",
      ...(stock !== undefined && {
        inventory: {
          upsert: {
            create: { quantity: parseInt(stock) },
            update: { quantity: parseInt(stock) },
          },
        },
      }),
    },
    include: {
      category: true,
      inventory: true,
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