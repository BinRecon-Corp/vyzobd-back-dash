import { z } from "zod";

export const createShipmentSchema = z.object({
  orderId: z.string().uuid("Invalid Order ID"),
  courierId: z.string().uuid("Invalid Courier ID").optional(),
  trackingNumber: z.string().optional(),
  items: z.array(z.object({
    orderItemId: z.string().uuid("Invalid Order Item ID"),
    quantity: z.number().int().positive("Quantity must be positive")
  })).min(1, "At least one item is required")
});

export const updateShipmentStatusSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "PACKED", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED_DELIVERY", "RETURNED"]),
  location: z.string().optional(),
  description: z.string().optional()
});
