import express, { type Express } from "express";

import { createHealthRouter } from "./modules/health/health.router.js";
import { createMonsterRouter } from "./modules/monsters/monster.router.js";
import { type MonsterService } from "./modules/monsters/monster.service.js";
import {
  errorHandler,
  notFoundHandler,
} from "./shared/middlewares/error-handler.js";
import { requestLogger } from "./shared/middlewares/request-logger.js";

export interface AppDeps {
  checkDatabase: () => Promise<void>;
  monsterService: MonsterService;
}

export function createApp(deps: AppDeps): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(requestLogger);
  app.use(express.json());

  app.use("/health", createHealthRouter({ checkDatabase: deps.checkDatabase }));
  app.use("/monsters", createMonsterRouter(deps.monsterService));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
