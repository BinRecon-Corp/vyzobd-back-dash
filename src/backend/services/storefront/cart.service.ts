import { prisma } from "../../config/db";
import { AppError } from "../../utils/AppError";

export class StorefrontCartService {
  static async getCart(customerId: string) {
    let cart = await prisma.cart.findUnique({
      where: { customerId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                isActive: true,
                status: true,
                deletedAt: true,
                trackInventory: true,
                inventory: {
                  select: {
                    quantityAvailable: true,
                    quantityReserved: true,
                  },
                },
                images: {
                  where: { isPrimary: true },
                  take: 1,
                  select: { url: true, altText: true },
                },
              },
            },
            variant: {
              select: {
                id: true,
                sku: true,
                price: true,
                compareAtPrice: true,
                isActive: true,
                deletedAt: true,
                inventories: {
                  select: {
                    quantityAvailable: true,
                    quantityReserved: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { customerId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  price: true,
                  isActive: true,
                  status: true,
                  deletedAt: true,
                  trackInventory: true,
                  inventory: {
                    select: {
                      quantityAvailable: true,
                      quantityReserved: true,
                    },
                  },
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                    select: { url: true, altText: true },
                  },
                },
              },
              variant: {
                select: {
                  id: true,
                  sku: true,
                  price: true,
                  compareAtPrice: true,
                  isActive: true,
                  deletedAt: true,
                  inventories: {
                    select: {
                      quantityAvailable: true,
                      quantityReserved: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }

    const validItems = cart.items.filter(
      (item) =>
        item.product &&
        item.product.isActive &&
        item.product.status === "Active" &&
        !item.product.deletedAt &&
        (!item.variantId || (item.variant && item.variant.isActive && !item.variant.deletedAt))
    );

    let subtotal = 0;
    const itemsWithPricing = validItems.map((item) => {
      const unitPrice = item.variant
        ? Number(item.variant.price)
        : Number(item.product.price || 0);
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      return {
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productSlug: item.product.slug,
        productImage: item.product.images[0]?.url || null,
        variantId: item.variantId,
        variantSku: item.variant?.sku || null,
        quantity: item.quantity,
        unitPrice,
        subtotal: itemSubtotal,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    return {
      id: cart.id,
      customerId: cart.customerId,
      itemCount: itemsWithPricing.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      items: itemsWithPricing,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  static async addItem(
    customerId: string,
    dto: { productId: string; variantId?: string | null; quantity: number }
  ) {
    const product = await prisma.product.findFirst({
      where: {
        id: dto.productId,
        isActive: true,
        status: "Active",
        deletedAt: null,
      },
      include: {
        inventory: true,
      },
    });

    if (!product) {
      throw new AppError("Product not found or unavailable", 404, "NOT_FOUND");
    }

    let variant: any = null;
    if (dto.variantId) {
      variant = await prisma.productVariant.findFirst({
        where: {
          id: dto.variantId,
          productId: dto.productId,
          isActive: true,
          deletedAt: null,
        },
        include: {
          inventories: true,
        },
      });

      if (!variant) {
        throw new AppError("Product variant not found or unavailable", 404, "NOT_FOUND");
      }
    }

    if (product.trackInventory) {
      let availableStock = 0;

      if (variant) {
        const totalStock = variant.inventories.reduce(
          (sum: number, inv: any) => sum + (inv.quantityAvailable - inv.quantityReserved),
          0
        );
        availableStock = Math.max(0, totalStock);
      } else if (product.inventory) {
        availableStock = Math.max(
          0,
          product.inventory.quantityAvailable - product.inventory.quantityReserved
        );
      }

      const cart = await prisma.cart.findUnique({
        where: { customerId },
        include: { items: true },
      });

      const existingCartItem = cart?.items.find(
        (i) => i.productId === dto.productId && i.variantId === (dto.variantId || null)
      );

      const requestedTotal = (existingCartItem ? existingCartItem.quantity : 0) + dto.quantity;

      if (requestedTotal > availableStock) {
        throw new AppError(
          `Insufficient stock. Available: ${availableStock}, Requested in cart: ${requestedTotal}`,
          400,
          "INSUFFICIENT_STOCK"
        );
      }
    }

    return await prisma.$transaction(async (tx) => {
      let cart = await tx.cart.findUnique({
        where: { customerId },
      });

      if (!cart) {
        cart = await tx.cart.create({
          data: { customerId },
        });
      }

      const existingItem = await tx.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId || null,
        },
      });

      if (existingItem) {
        await tx.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + dto.quantity,
          },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId: dto.productId,
            variantId: dto.variantId || null,
            quantity: dto.quantity,
          },
        });
      }

      return this.getCart(customerId);
    });
  }

  static async updateItem(
    customerId: string,
    cartItemId: string,
    quantity: number
  ) {
    const cart = await prisma.cart.findUnique({
      where: { customerId },
    });

    if (!cart) {
      throw new AppError("Cart not found", 404, "NOT_FOUND");
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        cartId: cart.id,
      },
      include: {
        product: {
          include: { inventory: true },
        },
        variant: {
          include: { inventories: true },
        },
      },
    });

    if (!cartItem) {
      throw new AppError("Cart item not found", 404, "NOT_FOUND");
    }

    if (cartItem.product.trackInventory) {
      let availableStock = 0;
      if (cartItem.variant) {
        const totalStock = cartItem.variant.inventories.reduce(
          (sum, inv) => sum + (inv.quantityAvailable - inv.quantityReserved),
          0
        );
        availableStock = Math.max(0, totalStock);
      } else if (cartItem.product.inventory) {
        availableStock = Math.max(
          0,
          cartItem.product.inventory.quantityAvailable - cartItem.product.inventory.quantityReserved
        );
      }

      if (quantity > availableStock) {
        throw new AppError(
          `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`,
          400,
          "INSUFFICIENT_STOCK"
        );
      }
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    return this.getCart(customerId);
  }

  static async removeItem(customerId: string, cartItemId: string) {
    const cart = await prisma.cart.findUnique({
      where: { customerId },
    });

    if (!cart) {
      return this.getCart(customerId);
    }

    await prisma.cartItem.deleteMany({
      where: {
        id: cartItemId,
        cartId: cart.id,
      },
    });

    return this.getCart(customerId);
  }

  static async clearCart(customerId: string) {
    const cart = await prisma.cart.findUnique({
      where: { customerId },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return this.getCart(customerId);
  }
}
