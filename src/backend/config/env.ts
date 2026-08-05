import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url().default("postgresql://user:password@localhost:5432/ecommerce?schema=public"),
  JWT_SECRET: z.string().min(10).default("super-secret-jwt-key-change-in-prod"),
  JWT_EXPIRES_IN: z.string().default("1h"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  GA_MEASUREMENT_ID: z.string().optional(),
  GA_API_SECRET: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:");
  console.error(_env.error.format());
  process.exit(1);
}

export const env = _env.data;
