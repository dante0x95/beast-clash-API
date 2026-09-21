import { defineConfig } from "vitest/config";

import { TEST_DATABASE_URL } from "./src/testing/integration/test-database.js";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      NODE_ENV: "test",
      DATABASE_URL: TEST_DATABASE_URL,
      LOG_LEVEL: "silent",
    },
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.fixture.ts",
        "src/index.ts",
        "src/generated/**",
        "src/testing/**",
      ],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/*.integration.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["src/**/*.integration.test.ts"],
          globalSetup: ["./src/testing/integration/global-setup.ts"],
          setupFiles: ["./src/testing/integration/setup.ts"],
          // tests share one database, so files must not run in parallel
          fileParallelism: false,
        },
      },
    ],
  },
});
