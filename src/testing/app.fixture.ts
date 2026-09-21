import { type AppDeps } from "../app.js";
import { makeBattleService } from "../modules/battles/battle.fixture.js";
import { makeMonsterService } from "../modules/monsters/monster.fixture.js";

/** App deps for tests: stub services, a healthy database and no allowed CORS origins. */
export function makeAppDeps(overrides: Partial<AppDeps> = {}): AppDeps {
  return {
    battleService: makeBattleService(),
    checkDatabase: () => Promise.resolve(),
    config: { corsOrigins: [] },
    monsterService: makeMonsterService(),
    ...overrides,
  };
}
