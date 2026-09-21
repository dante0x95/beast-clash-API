import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { createPrismaMonsterRepository } from "../modules/monsters/prisma-monster.repository.js";
import { createPrismaClient } from "../shared/db/prisma.js";
import { seedMonsters } from "./seed-monsters.js";

const prisma = createPrismaClient(env.DATABASE_URL);

try {
  const result = await seedMonsters(createPrismaMonsterRepository(prisma));

  if (result.status === "created") {
    logger.info({ count: result.count }, "seeded sample monsters");
  } else {
    logger.info(
      { existing: result.existing },
      "monsters table is not empty, skipping seed",
    );
  }
} catch (error) {
  logger.fatal({ err: error }, "seed failed");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
