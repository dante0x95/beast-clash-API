import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: [
        "src/**/*.test.ts",
        "src/index.ts",
        "src/generated/**",
        "src/**/*.fixture.ts",
      ],
    },
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://beast:beast@localhost:5433/beast_clash_test",
      LOG_LEVEL: "silent",
    },
  },
});