import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { createHealthRouter } from "./modules/health/health.router.js";
import { requestLogger } from "./shared/middlewares/request-logger.js";

export interface AppDeps {
  checkDatabase: () => Promise<void>;
}

export function createApp({ checkDatabase }: AppDeps): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(requestLogger);
  app.use(express.json());

  app.use("/health", createHealthRouter({ checkDatabase }));

  app.use((_req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  app.use(
    (error: unknown, req: Request, res: Response, _next: NextFunction) => {
      req.log.error({ err: error }, "error no controlado");
      res.status(500).json({ error: "Internal Server Error" });
    },
  );

  return app;
}
