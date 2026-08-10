import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { CloudinaryService, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "./cloudinary.service";

export class ProductMediaService {
  /**
   * Helper to format product media properties (thumbnail, gallery, primaryImage)
   */
  static formatProductMedia(product: any) {
    const images = (product.images || []).map((img: any) => ({
      id: img.id,
      productId: img.productId,
      imageUrl: img.imageUrl || img.url,
      url: img.url || img.imageUrl,
      publicId: img.publicId || null,
      altText: img.altText || null,
      sortOrder: img.sortOrder || 0,
      isPrimary: Boolean(img.isPrimary),
      createdAt: img.createdAt,
      updatedAt: img.updatedAt,
    })).sort((a: any, b: any) => a.sortOrder - b.sortOrder);

    const primaryImageObj = images.find((i: any) => i.isPrimary) || images[0] || null;
    const primaryImageUrl = primaryImageObj?.imageUrl || primaryImageObj?.url || product.ogImage || null;
    const gallery = images.filter((i: any) => !i.isPrimary);

    return {
      ...product,
      images,
      primaryImage: primaryImageObj || primaryImageUrl,
      thumbnail: primaryImageUrl,
      gallery,
    };
  }

  /**
   * Migrate existing product image URL fields into ProductImage records
   */
  static async migrateExistingProductMedia() {
    try {
      const productsWithoutImages = await prisma.product.findMany({
        where: {
          deletedAt: null,
        },
        include: {
          images: true,
        },
      });

      for (const product of productsWithoutImages) {
        // If product has no images at all, but has ogImage or other fields
        if (product.images.length === 0 && product.ogImage) {
          await prisma.productImage.create({
            data: {
              productId: product.id,
              imageUrl: product.ogImage,
              url: product.ogImage,
              isPrimary: true,
              sortOrder: 0,
            },
          });
        } else {
          // Sync imageUrl and url for existing records if missing
          for (const img of product.images) {
            if (!img.imageUrl || img.imageUrl === "") {
              await prisma.productImage.update({
                where: { id: img.id },
                data: {
                  imageUrl: img.url || "",
                },
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("Migration of existing product media encountered error:", err);
    }
  }

  /**
   * Upload image to a product
   */
  static async uploadImage(
    productId: string,
    file?: Express.Multer.File,
    body?: { imageUrl?: string; altText?: string; isPrimary?: boolean | string }
  ) {
    const product = await prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      include: { images: true },
    });

    if (!product) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }

    let imageUrl = "";
    let publicId: string | null = null;

    if (file) {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
        throw new AppError(
          "Invalid file format. Only JPG, JPEG, PNG, and WEBP are allowed.",
          400,
          "INVALID_FILE_TYPE"
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new AppError("File size exceeds 5MB limit.", 400, "FILE_TOO_LARGE");
      }

      const uploadResult = await CloudinaryService.uploadImage(file.buffer, file.mimetype, `products/${productId}`);
      imageUrl = uploadResult.imageUrl;
      publicId = uploadResult.publicId;
    } else if (body?.imageUrl) {
      imageUrl = body.imageUrl;
    } else {
      throw new AppError("No image file or imageUrl provided.", 400, "MISSING_IMAGE");
    }

    const isFirstImage = product.images.length === 0;
    const isPrimary = isFirstImage || String(body?.isPrimary) === "true";

    if (isPrimary) {
      await prisma.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      });
    }

    const nextSortOrder = product.images.length;

    const newImage = await prisma.productImage.create({
      data: {
        productId,
        imageUrl,
        url: imageUrl,
        publicId,
        altText: body?.altText || null,
        sortOrder: nextSortOrder,
        isPrimary,
      },
    });

    return newImage;
  }

  /**
   * Delete an image from product
   */
  static async deleteImage(productId: string, imageId: string) {
    const image = await prisma.productImage.findFirst({
      where: { id: imageId, productId, deletedAt: null },
    });

    if (!image) {
      throw new AppError("Product image not found", 404, "IMAGE_NOT_FOUND");
    }

    if (image.publicId) {
      await CloudinaryService.deleteImage(image.publicId);
    }

    await prisma.productImage.delete({
      where: { id: imageId },
    });

    // If deleted image was primary, set the first remaining image as primary
    if (image.isPrimary) {
      const remainingImage = await prisma.productImage.findFirst({
        where: { productId, deletedAt: null },
        orderBy: { sortOrder: "asc" },
      });

      if (remainingImage) {
        await prisma.productImage.update({
          where: { id: remainingImage.id },
          data: { isPrimary: true },
        });
      }
    }

    return true;
  }

  /**
   * Reorder product images
   */
  static async reorderImages(productId: string, imageIds: string[]) {
    const product = await prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });

    if (!product) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }

    await prisma.$transaction(
      imageIds.map((id, index) =>
        prisma.productImage.updateMany({
          where: { id, productId },
          data: { sortOrder: index },
        })
      )
    );

    const updatedImages = await prisma.productImage.findMany({
      where: { productId, deletedAt: null },
      orderBy: { sortOrder: "asc" },
    });

    return updatedImages;
  }

  /**
   * Set primary product image
   */
  static async setPrimaryImage(productId: string, imageId: string) {
    const image = await prisma.productImage.findFirst({
      where: { id: imageId, productId, deletedAt: null },
    });

    if (!image) {
      throw new AppError("Product image not found", 404, "IMAGE_NOT_FOUND");
    }

    await prisma.$transaction([
      prisma.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      }),
      prisma.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);

    const updatedImages = await prisma.productImage.findMany({
      where: { productId, deletedAt: null },
      orderBy: { sortOrder: "asc" },
    });

    return updatedImages;
  }
}
