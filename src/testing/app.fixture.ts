import { type AppConfig, type AppDeps } from "../app.js";
import { makeBattleService } from "../modules/battles/battle.fixture.js";
import { makeMonsterService } from "../modules/monsters/monster.fixture.js";

export type AppDepsOverrides = Partial<Omit<AppDeps, "config">> & {
  config?: Partial<AppConfig>;
};

/**
 * App deps for tests: stub services, a healthy database, no CORS origins, no rate limit
 * and no trusted proxies. `config` is merged, so a test only sets the keys it cares about.
 */
export function makeAppDeps({
  config,
  ...overrides
}: AppDepsOverrides = {}): AppDeps {
  return {
    battleService: makeBattleService(),
    checkDatabase: () => Promise.resolve(),
    config: { corsOrigins: [], rateLimit: null, trustProxy: 0, ...config },
    monsterService: makeMonsterService(),
    ...overrides,
  };
}
