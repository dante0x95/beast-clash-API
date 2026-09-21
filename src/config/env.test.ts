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

  describe("TRUST_PROXY", () => {
    it("defaults to trusting no proxy", () => {
      expect(envSchema.parse(validEnv).TRUST_PROXY).toBe(0);
    });

    it("rejects a negative value", () => {
      const result = envSchema.safeParse({ ...validEnv, TRUST_PROXY: "-1" });

      expect(result.success).toBe(false);
    });
  });

  describe("rate limit", () => {
    it("defaults to 100 requests per minute", () => {
      const result = envSchema.parse(validEnv);

      expect(result.RATE_LIMIT_MAX).toBe(100);
      expect(result.RATE_LIMIT_WINDOW_MS).toBe(60_000);
    });

    it("rejects a non-positive limit", () => {
      const result = envSchema.safeParse({
        ...validEnv,
        RATE_LIMIT_MAX: "0",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("CORS_ORIGINS", () => {
    it("defaults to an empty list", () => {
      expect(envSchema.parse(validEnv).CORS_ORIGINS).toEqual([]);
    });

    it("splits a comma-separated list and trims each origin", () => {
      const result = envSchema.parse({
        ...validEnv,
        CORS_ORIGINS: " http://localhost:5173 , https://app.example.com,",
      });

      expect(result.CORS_ORIGINS).toEqual([
        "http://localhost:5173",
        "https://app.example.com",
      ]);
    });

    it.each([
      ["a trailing slash", "https://app.example.com/"],
      ["a path", "https://app.example.com/app"],
      ["a non-http protocol", "ftp://app.example.com"],
      ["a value that is not a URL", "localhost:5173"],
    ])("rejects an origin with %s", (_case, origin) => {
      const result = envSchema.safeParse({
        ...validEnv,
        CORS_ORIGINS: origin,
      });

      expect(result.success).toBe(false);
    });
  });

  it("rejects an unknown NODE_ENV", () => {
    const result = envSchema.safeParse({ ...validEnv, NODE_ENV: "staging" });

    expect(result.success).toBe(false);
  });
});
