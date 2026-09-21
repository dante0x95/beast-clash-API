import { type BattleSnapshot } from "./battle.schemas.js";
import { type NewBattle } from "./battle.types.js";

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
