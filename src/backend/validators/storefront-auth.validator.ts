import { z } from "zod";

export const customerStrongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const customerRegisterSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: customerStrongPasswordSchema,
});

export const customerLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const customerForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const customerResetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: customerStrongPasswordSchema,
});
