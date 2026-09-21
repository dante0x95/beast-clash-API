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

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: databaseUrlSchema,
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});
