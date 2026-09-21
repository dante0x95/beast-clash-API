import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { createPrismaClient, pingDatabase } from "./shared/db/prisma.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const prisma = createPrismaClient(env.DATABASE_URL);

try {
  await pingDatabase(prisma);
  logger.info("database connection verified");
} catch (error) {
  logger.fatal({ err: error }, "could not connect to the database");
  await prisma.$disconnect();
  process.exit(1);
}

const app = createApp({ checkDatabase: () => pingDatabase(prisma) });

const server = app.listen(env.PORT, (error) => {
  if (error) {
    logger.fatal({ err: error }, "could not start the server");
    process.exit(1);
  }
  logger.info({ env: env.NODE_ENV, port: env.PORT }, "server listening");
});

let shuttingDown = false;

function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "shutting down server");

  const forceExit = setTimeout(() => {
    logger.error("forced shutdown due to timeout");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  server.close((serverError) => {
    if (serverError) {
      logger.error({ err: serverError }, "error while shutting down the server");
    }
    prisma
      .$disconnect()
      .then(() => {
        logger.info("server and database closed");
        process.exit(serverError ? 1 : 0);
      })
      .catch((dbError: unknown) => {
        logger.error({ err: dbError }, "error while disconnecting prisma");
        process.exit(1);
      });
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
