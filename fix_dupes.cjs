const fs = require('fs');
const file = 'src/backend/services/storefront/cart.service.ts';
let code = fs.readFileSync(file, 'utf8');

const mergeStr = "  static async mergeGuestCart(guestSessionId: string, customerId: string) {";
const firstMergeIdx = code.indexOf(mergeStr);

// I will just remove everything from the first mergeGuestCart onwards, and append the correct mergeGuestCart function + "}"
const cleanCode = code.substring(0, firstMergeIdx);

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
  }
}
`;

fs.writeFileSync(file, cleanCode + replacement);
console.log('Fixed duplications');
