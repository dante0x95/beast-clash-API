import { createPrismaClient } from "../../shared/db/prisma.js";
import { TEST_DATABASE_URL } from "./test-database.js";

export const testPrisma = createPrismaClient(TEST_DATABASE_URL);

/** Empties every application table, keeping the migrations history. */
export async function resetDatabase(): Promise<void> {
  const [{ name }] = await testPrisma.$queryRaw<
    [{ name: string }]
  >`SELECT current_database() AS name`;
  // Safety net: never truncate a database that is not a test database
  if (!name.endsWith("_test")) {
    throw new Error(`Refusing to reset non-test database "${name}"`);
  }

  const tables = await testPrisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (tables.length === 0) return;

  const list = tables
    .map(({ tablename }) => `"public"."${tablename}"`)
    .join(", ");
  await testPrisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`,
  );
}
