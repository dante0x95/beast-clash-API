import { describe, expect, it } from "vitest";

import { envSchema } from "./env.schema.js";

describe("envSchema", () => {
  const validEnv = {
    DATABASE_URL: "postgresql://localhost:5432/test",
  };

  it("accepts a valid env and applies defaults", () => {
    const result = envSchema.parse(validEnv);

    expect(result.PORT).toBe(3000);
    expect(result.NODE_ENV).toBe("development");
  });

  it("converts PORT from string to number", () => {
    const result = envSchema.parse({ ...validEnv, PORT: "8080" });

    expect(result.PORT).toBe(8080);
  });

  it("rejects an invalid DATABASE_URL", () => {
    const result = envSchema.safeParse({ DATABASE_URL: "not-a-url" });

    expect(result.success).toBe(false);
  });

  it.each([
    "postgres://beast:beast@localhost:5433/beast_clash",
    "postgresql://beast:beast@localhost:5433/beast_clash_test",
  ])("accepts the postgres URL %s", (url) => {
    expect(envSchema.safeParse({ DATABASE_URL: url }).success).toBe(true);
  });

  it.each([
    ["a non-postgres protocol", "mysql://localhost:3306/test"],
    ["a missing database name", "postgresql://localhost:5432"],
    [
      "a database name glued to another variable",
      "postgresql://localhost:5432/beast_clashLOG_LEVEL=debug",
    ],
    ["a nested path", "postgresql://localhost:5432/a/b"],
  ])("rejects a DATABASE_URL with %s", (_case, url) => {
    expect(envSchema.safeParse({ DATABASE_URL: url }).success).toBe(false);
  });

  it("rejects an unknown NODE_ENV", () => {
    const result = envSchema.safeParse({ ...validEnv, NODE_ENV: "staging" });

    expect(result.success).toBe(false);
  });
});
