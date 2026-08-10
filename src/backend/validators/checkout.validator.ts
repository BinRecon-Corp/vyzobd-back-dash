import { z } from "zod";

export const applyCouponSchema = z.object({
  couponCode: z.string().min(1, "Coupon code is required"),
});

export const updateShippingSchema = z.object({
  shippingAddressId: z.string().uuid("Invalid Shipping Address ID format"),
  billingAddressId: z.string().uuid("Invalid Billing Address ID format").optional(),
});

export const completeCheckoutSchema = z.object({
  paymentMethod: z.string().min(1, "Payment method is required"),
});
