import express, { type Express } from "express";
import helmet from "helmet";

import { createDocsRouter } from "./docs/docs.router.js";
import { buildOpenApiDocument } from "./docs/openapi.js";
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
import {
  createRateLimitMiddleware,
  type RateLimitConfig,
} from "./shared/middlewares/rate-limit.js";
import { requestLogger } from "./shared/middlewares/request-logger.js";

export interface AppConfig {
  corsOrigins: readonly string[];
  /** null disables rate limiting (tests). */
  rateLimit: RateLimitConfig | null;
}

export interface AppDeps {
  battleService: BattleService;
  checkDatabase: () => Promise<void>;
  config: AppConfig;
  monsterService: MonsterService;
}
const JSON_BODY_LIMIT = "10kb";
export function createApp(deps: AppDeps): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: { directives: { upgradeInsecureRequests: null } },
    }),
  );
  app.use(requestLogger);
  app.use(createCorsMiddleware(deps.config.corsOrigins));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  // mounted before the limiter on purpose: probes from the platform must never be throttled
  app.use(
    "/health",
    createHealthRouter({ checkDatabase: deps.checkDatabase }),
  );
  app.use("/docs", createDocsRouter(buildOpenApiDocument()));

  if (deps.config.rateLimit) {
    app.use(createRateLimitMiddleware(deps.config.rateLimit));
  }

  app.use("/monsters", createMonsterRouter(deps.monsterService));
  app.use("/battles", createBattleRouter(deps.battleService));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
