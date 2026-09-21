import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const app = createApp();

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

  server.close((error) => {
    if (error) {
      logger.error({ err: error }, "error al cerrar el servidor");
      process.exit(1);
    }
    logger.info("servidor cerrado");
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
