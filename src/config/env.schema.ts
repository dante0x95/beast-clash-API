import { z } from "zod";

// catches values like "beast_clashLOG_LEVEL=debug": still a valid URL, but not a real database name
const DATABASE_NAME = /^[A-Za-z0-9_]+$/;

const databaseUrlSchema = z
  .url({ protocol: /^postgres(ql)?$/ })
  // Zod 4 keeps running refinements after a failed format check, so guard new URL()
  .refine(
    (value) =>
      URL.canParse(value)
      && DATABASE_NAME.test(new URL(value).pathname.slice(1)),
    {
      message:
        "DATABASE_URL must end with a database name (letters, digits or _)",
    },
  );

const originSchema = z
  .url({ protocol: /^https?$/ })
  .refine((value) => URL.canParse(value) && new URL(value).origin === value, {
    message:
        "must be a bare origin like https://app.example.com (no path or trailing slash)",
  });

const corsOriginsSchema = z
  .string()
  .default("")
  .transform((value) =>
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  )
  .pipe(z.array(originSchema));

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: databaseUrlSchema,
  CORS_ORIGINS: corsOriginsSchema,
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
});
