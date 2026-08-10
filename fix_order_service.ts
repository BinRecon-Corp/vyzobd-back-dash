import fs from "fs";

let content = fs.readFileSync("src/backend/services/storefront/order.service.ts", "utf8");

content = content.replace(/return \{\n      orderId: order\.id,\n      orderNumber: order\.orderNumber,\n      \} *\n    \}\);\n  \}/, `return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      timeline,
    };
  }

  static async getOrderShipments(customerId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId, customerId }
    });
    if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    
    return prisma.shipment.findMany({
      where: { orderId },
      include: {
        courier: true,
        trackingEvents: { orderBy: { timestamp: 'desc' } },
        items: { include: { orderItem: { include: { product: true } } } }
      }
    });
  }
}`);

fs.writeFileSync("src/backend/services/storefront/order.service.ts", content);
