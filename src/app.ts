import express, { type Express } from "express";

import { createBattleRouter } from "./modules/battles/battle.router.js";
import { type BattleService } from "./modules/battles/battle.service.js";
import { createHealthRouter } from "./modules/health/health.router.js";
import { createMonsterRouter } from "./modules/monsters/monster.router.js";
import { type MonsterService } from "./modules/monsters/monster.service.js";
import { createCorsMiddleware } from "./shared/middlewares/cors.js";
import {
  errorHandler,
  notFoundHandler,
} from "./shared/middlewares/error-handler.js";
import { requestLogger } from "./shared/middlewares/request-logger.js";

export interface AppConfig {
  corsOrigins: readonly string[];
}

export interface AppDeps {
  battleService: BattleService;
  checkDatabase: () => Promise<void>;
  config: AppConfig;
  monsterService: MonsterService;
}

export function createApp(deps: AppDeps): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(requestLogger);
  app.use(createCorsMiddleware(deps.config.corsOrigins));
  app.use(express.json());

  app.use("/health", createHealthRouter({ checkDatabase: deps.checkDatabase }));
  app.use("/monsters", createMonsterRouter(deps.monsterService));
  app.use("/battles", createBattleRouter(deps.battleService));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
