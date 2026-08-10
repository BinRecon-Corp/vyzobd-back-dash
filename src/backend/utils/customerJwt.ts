import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "./AppError";

export const generateCustomerAccessToken = (customerId: string, email: string) => {
  return jwt.sign(
    { id: customerId, email, tokenType: "access" },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN as any,
      issuer: "vyzobd-storefront",
      audience: "customer",
    }
  );
};

export const generateCustomerRefreshToken = (customerId: string, email: string) => {
  return jwt.sign(
    { id: customerId, email, tokenType: "refresh" },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
      issuer: "vyzobd-storefront",
      audience: "customer",
    }
  );
};

export const verifyCustomerToken = (token: string) => {
  try {
    return jwt.verify(token, env.JWT_SECRET, {
      issuer: "vyzobd-storefront",
      audience: "customer",
    }) as { id: string; email: string; tokenType: string };
  } catch (error) {
    throw new AppError("Invalid or expired customer token", 401, "UNAUTHORIZED");
  }
};
