import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().uuid("Invalid Product ID format"),
  variantId: z.string().uuid("Invalid Variant ID format").optional().nullable(),
  quantity: z.number().int("Quantity must be an integer").min(1, "Quantity must be at least 1"),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int("Quantity must be an integer").min(1, "Quantity must be at least 1"),
});
