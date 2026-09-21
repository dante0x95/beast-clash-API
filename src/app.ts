import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { logger } from "./lib/logger.js";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      logger.error({ err: error }, "error no controlado");
      res.status(500).json({ error: "Internal Server Error" });
    },
  );

  return app;
}
