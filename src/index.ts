import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { createPrismaClient, pingDatabase } from "./shared/db/prisma.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const prisma = createPrismaClient(env.DATABASE_URL);

try {
  await pingDatabase(prisma);
  logger.info("conexión a la base de datos verificada");
} catch (error) {
  logger.fatal({ err: error }, "no se pudo conectar a la base de datos");
  await prisma.$disconnect();
  process.exit(1);
}

const app = createApp({ checkDatabase: () => pingDatabase(prisma) });

const server = app.listen(env.PORT, (error) => {
  if (error) {
    logger.fatal({ err: error }, "no se pudo iniciar el servidor");
    process.exit(1);
  }
  logger.info({ env: env.NODE_ENV, port: env.PORT }, "servidor escuchando");
});

let shuttingDown = false;

function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "cerrando servidor");

  const forceExit = setTimeout(() => {
    logger.error("cierre forzado por timeout");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  server.close((serverError) => {
    if (serverError) {
      logger.error({ err: serverError }, "error al cerrar el servidor");
    }
    prisma
      .$disconnect()
      .then(() => {
        logger.info("servidor y base de datos cerrados");
        process.exit(serverError ? 1 : 0);
      })
      .catch((dbError: unknown) => {
        logger.error({ err: dbError }, "error al desconectar prisma");
        process.exit(1);
      });
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
