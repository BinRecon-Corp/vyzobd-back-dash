const fs = require('fs');
const file = 'src/backend/services/storefront/cart.service.ts';
let code = fs.readFileSync(file, 'utf8');

const replacement = `  static async mergeGuestCart(guestSessionId: string, customerId: string) {
    const guestCart = await prisma.cart.findFirst({
      where: { sessionId: guestSessionId },
      include: { items: true },
    });

    if (!guestCart || guestCart.items.length === 0) {
      if (guestCart) {
        await prisma.cart.delete({ where: { id: guestCart.id } });
      }
      return;
    }

    await prisma.$transaction(async (tx) => {
      let customerCart = await tx.cart.findFirst({
        where: { customerId },
        include: { items: true },
      });

      if (!customerCart) {
        customerCart = await tx.cart.create({
          data: { customerId },
          include: { items: true },
        });
      }

      for (const guestItem of guestCart.items) {
        const existingItem = customerCart.items.find(
          (i) => i.productId === guestItem.productId && i.variantId === guestItem.variantId
        );

        if (existingItem) {
          await tx.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + guestItem.quantity },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: customerCart.id,
              productId: guestItem.productId,
              variantId: guestItem.variantId,
              quantity: guestItem.quantity,
            },
          });
        }
      }

      // Delete guest cart after merge
      await tx.cart.delete({
        where: { id: guestCart.id },
      });
    });
  }`;

const startStr = "  static async mergeGuestCart(guestSessionId: string, customerId: string) {";
const endStr = "    });\n  }";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr) + endStr.length;

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
  fs.writeFileSync(file, code);
  console.log('Fixed merge guest cart');
} else {
  console.log('Could not find start or end index');
}
