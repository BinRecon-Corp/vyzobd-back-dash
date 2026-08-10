import { z } from "zod";
import { customerStrongPasswordSchema } from "./storefront-auth.validator";

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
});

export const updateEmailSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
  currentPassword: z.string().min(1, "Current password is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: customerStrongPasswordSchema,
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export const createAddressSchema = z.object({
  label: z.string().optional().nullable(),
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().optional().nullable(),
  address1: z.string().min(1, "Address line 1 is required"),
  address2: z.string().optional().nullable(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();
