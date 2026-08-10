import { prisma } from "../config/db";
import { AppError } from "../utils/AppError";
import { ShipmentStatus, TrackingStatus } from "@prisma/client";

export class AdminShipmentService {
  static async createShipment(orderId: string, courierId: string | undefined, trackingNumber: string | undefined, items: { orderItemId: string, quantity: number }[]) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, shipments: { include: { items: true } } }
    });

    if (!order) {
      throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
    }

    // A real system might check if order is paid, but let's just check if it's not cancelled
    if (order.status === "Cancelled") {
      throw new AppError("Cannot create shipment for cancelled order", 400, "ORDER_CANCELLED");
    }

    // Validate quantities
    const orderItemMap = new Map(order.items.map(i => [i.id, i.quantity]));
    const shippedMap = new Map<string, number>();
    
    for (const shipment of order.shipments) {
      for (const item of shipment.items) {
        shippedMap.set(item.orderItemId, (shippedMap.get(item.orderItemId) || 0) + item.quantity);
      }
    }

    for (const item of items) {
      const orderedQty = orderItemMap.get(item.orderItemId);
      if (!orderedQty) {
        throw new AppError(`Item ${item.orderItemId} is not part of this order`, 400, "INVALID_ITEM");
      }
      const previouslyShipped = shippedMap.get(item.orderItemId) || 0;
      if (previouslyShipped + item.quantity > orderedQty) {
        throw new AppError(`Cannot ship ${item.quantity} of item ${item.orderItemId}. Only ${orderedQty - previouslyShipped} remaining.`, 400, "EXCEEDS_ORDERED_QUANTITY");
      }
    }

    return await prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.create({
        data: {
          orderId,
          courierId,
          trackingNumber,
          status: ShipmentStatus.PENDING,
          items: {
            create: items.map(i => ({
              orderItemId: i.orderItemId,
              quantity: i.quantity
            }))
          },
          trackingEvents: {
            create: {
              status: TrackingStatus.INFO_RECEIVED,
              description: "Shipment information received"
            }
          }
        },
        include: {
          items: true,
          trackingEvents: true
        }
      });

      // Update Order Status to PROCESSING if not already
      if (order.status === "Pending") {
        await tx.order.update({
          where: { id: orderId },
          data: { status: "PROCESSING" }
        });
      }

      await tx.orderTimeline.create({
        data: {
          orderId,
          status: "PROCESSING",
          action: `Shipment created with tracking number ${trackingNumber || 'N/A'}`
        }
      });

      return shipment;
    });
  }

  static async getShipments() {
    return prisma.shipment.findMany({
      include: { order: true, courier: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getShipmentById(id: string) {
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: { items: { include: { orderItem: { include: { product: true } } } }, trackingEvents: { orderBy: { timestamp: 'desc' } }, courier: true }
    });

    if (!shipment) {
      throw new AppError("Shipment not found", 404, "SHIPMENT_NOT_FOUND");
    }

    return shipment;
  }

  static async updateShipmentStatus(id: string, status: ShipmentStatus, location?: string, description?: string) {
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: { order: { include: { shipments: { include: { items: true } }, items: true } } }
    });

    if (!shipment) {
      throw new AppError("Shipment not found", 404, "SHIPMENT_NOT_FOUND");
    }

    return await prisma.$transaction(async (tx) => {
      const updatedShipment = await tx.shipment.update({
        where: { id },
        data: {
          status,
          shippedAt: status === "SHIPPED" && !shipment.shippedAt ? new Date() : undefined,
          deliveredAt: status === "DELIVERED" && !shipment.deliveredAt ? new Date() : undefined
        }
      });

      let trackingStatus: TrackingStatus = TrackingStatus.INFO_RECEIVED;
      if (status === "SHIPPED" || status === "IN_TRANSIT") trackingStatus = TrackingStatus.IN_TRANSIT;
      if (status === "OUT_FOR_DELIVERY") trackingStatus = TrackingStatus.OUT_FOR_DELIVERY;
      if (status === "DELIVERED") trackingStatus = TrackingStatus.DELIVERED;
      if (status === "FAILED_DELIVERY" || status === "RETURNED") trackingStatus = TrackingStatus.EXCEPTION;

      await tx.trackingEvent.create({
        data: {
          shipmentId: id,
          status: trackingStatus,
          location,
          description: description || `Status updated to ${status}`
        }
      });

      // Update Order Status based on shipments
      let allDelivered = false;
      let anyShipped = false;

      // In a real system, you'd check if all ordered items are in delivered shipments.
      // For simplicity, we just check if this shipment changes order status.
      if (status === "DELIVERED") {
        await tx.order.update({
          where: { id: shipment.orderId },
          data: { status: "Delivered" }
        });
        await tx.orderTimeline.create({
          data: { orderId: shipment.orderId, status: "Delivered", action: "Order DELIVERED" }
        });
      } else if (status === "SHIPPED") {
        await tx.order.update({
          where: { id: shipment.orderId },
          data: { status: "Shipped" }
        });
        await tx.orderTimeline.create({
          data: { orderId: shipment.orderId, status: "Shipped", action: "Order SHIPPED" }
        });
      }

      return updatedShipment;
    });
  }
}
