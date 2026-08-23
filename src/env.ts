import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1, "BOT_TOKEN is required"),
  ADMIN_TELEGRAM_IDS: z
    .string()
    .min(1, "ADMIN_TELEGRAM_IDS is required")
    .transform((val) =>
      val
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .map(Number)
    ),
  DATABASE_PATH: z.string().default("./data/bot.db"),
  PORT: z
    .string()
    .default("3000")
    .transform((v) => Number(v)),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("24h"),
  ADMIN_USERNAME: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(6),
  DASHBOARD_ORIGIN: z.string().default("http://localhost:5173"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export function isAdmin(telegramId: number): boolean {
  return env.ADMIN_TELEGRAM_IDS.includes(telegramId);
}
