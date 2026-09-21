import { afterAll, beforeEach } from "vitest";

import { resetDatabase, testPrisma } from "./database.js";

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await testPrisma.$disconnect();
});
