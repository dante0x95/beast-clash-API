import { execSync } from "node:child_process";

import { TEST_DATABASE_URL } from "./test-database.js";

/** Applies pending migrations to the test database once, before any integration test runs. */
export default function setup(): void {
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    // globalSetup does not receive Vitest's `test.env`, so the URL is passed explicitly
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
