const fs = require('fs');

let content = fs.readFileSync('src/backend/services/abandoned_cart.service.ts', 'utf8');

const targetFunctionRegex = /for \(const cart of abandonedCarts\) \{[\s\S]*?\}[\s]*return abandonedCarts\.length;/m;

const replacement = `if (abandonedCarts.length > 0) {
      await prisma.abandonedCart.createMany({
        data: abandonedCarts.map(cart => ({
          cartId: cart.id,
          customerId: cart.customerId,
          lastActivityAt: cart.updatedAt
        }))
      });
      // Here you would trigger an email or notification
    }
    
    return abandonedCarts.length;`;

content = content.replace(targetFunctionRegex, replacement);
fs.writeFileSync('src/backend/services/abandoned_cart.service.ts', content, 'utf8');
