import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../generated/prisma/client.js";
import { logger } from "../../lib/logger.js";

export function createPrismaClient(connectionString: string): PrismaClient {
  const adapter = new PrismaPg(
    {
      connectionString,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5000,
    },
    {
      onPoolError: (error) => {
        logger.error({ err: error }, "error en un cliente inactivo del pool");
      },
    },
  );

  return new PrismaClient({ adapter });
}

export async function pingDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}
