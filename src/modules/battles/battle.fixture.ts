import { type BattleRepository } from "./battle.repository.js";
import { type BattleSnapshot } from "./battle.schemas.js";
import { type Battle, type NewBattle } from "./battle.types.js";

export function makeSnapshot(
  overrides: Partial<BattleSnapshot> = {},
): BattleSnapshot {
  return {
    name: "Pyrodrake",
    imageUrl: "https://example.com/pyrodrake.png",
    hp: 120,
    attack: 40,
    defense: 25,
    speed: 30,
    ...overrides,
  };
}

/** A consistent one-turn battle where `monsterAId` knocks out `monsterBId`. */
export function makeNewBattle(
  monsterAId: string,
  monsterBId: string,
): NewBattle {
  return {
    monsterA: {
      id: monsterAId,
      snapshot: makeSnapshot({ name: "Striker", attack: 200 }),
    },
    monsterB: { id: monsterBId, snapshot: makeSnapshot({ name: "Target" }) },
    winnerId: monsterAId,
    loserId: monsterBId,
    totalTurns: 1,
    turns: [
      {
        turn: 1,
        attackerId: monsterAId,
        defenderId: monsterBId,
        damage: 175,
        defenderHpAfter: 0,
      },
    ],
  };
}

export const BATTLE_ID = "01926f3e-8c2a-7b3d-9e4f-5a6b7c8d9eba";

/** A persisted battle as returned by the repository. */
export function makeBattle(monsterAId: string, monsterBId: string): Battle {
  return {
    id: BATTLE_ID,
    ...makeNewBattle(monsterAId, monsterBId),
    createdAt: new Date("2026-01-03T00:00:00.000Z"),
  };
}

/** Stub repository: every lookup misses unless the test overrides it; create echoes its input. */
export function makeBattleRepository(
  overrides: Partial<BattleRepository> = {},
): BattleRepository {
  return {
    create: (battle) =>
      Promise.resolve({
        ...battle,
        id: BATTLE_ID,
        createdAt: new Date("2026-01-03T00:00:00.000Z"),
      }),
    findById: () => Promise.resolve(null),
    list: ({ page, pageSize }) =>
      Promise.resolve({ items: [], total: 0, page, pageSize }),
    delete: () => Promise.resolve(false),
    ...overrides,
  };
}
