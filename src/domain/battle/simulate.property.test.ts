import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { simulateBattle } from "./simulate.js";

const combatant = (id: string) =>
  fc.record({
    id: fc.constant(id),
    hp: fc.integer({ min: 1, max: 200 }),
    attack: fc.integer({ min: 0, max: 100 }),
    defense: fc.integer({ min: 0, max: 100 }),
    speed: fc.integer({ min: 0, max: 100 }),
  });

describe("simulateBattle (properties)", () => {
  it("always ends with a consistent result for any valid combatants", () => {
    fc.assert(
      fc.property(combatant("a"), combatant("b"), (a, b) => {
        const result = simulateBattle(a, b);
        const lastTurn = result.turns.at(-1);

        expect(result.totalTurns).toBeLessThanOrEqual(a.hp + b.hp - 1);
        expect(result.turns.every((t) => t.damage >= 1 && t.defenderHpAfter >= 0)).toBe(true);
        expect(lastTurn?.defenderHpAfter).toBe(0);
        expect(result.winnerId).toBe(lastTurn?.attackerId);
        expect([result.winnerId, result.loserId].sort()).toEqual(["a", "b"]);
      }),
    );
  });
});
