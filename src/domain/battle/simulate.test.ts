import { describe, expect, it } from "vitest";

import { makeCombatant } from "./combatant.fixture.js";
import { simulateBattle } from "./simulate.js";

describe("simulateBattle", () => {
  it("ends in one turn when the first attacker knocks out the defender", () => {
    const striker = makeCombatant({ id: "striker", attack: 20, speed: 9 });
    const target = makeCombatant({
      id: "target",
      hp: 10,
      defense: 5,
      speed: 1,
    });

    const result = simulateBattle(target, striker);

    expect(result).toEqual({
      winnerId: "striker",
      loserId: "target",
      totalTurns: 1,
      turns: [
        {
          turn: 1,
          attackerId: "striker",
          defenderId: "target",
          damage: 15,
          defenderHpAfter: 0,
        },
      ],
    });
  });

  it("alternates attacker and defender every turn", () => {
    const a = makeCombatant({
      id: "a",
      hp: 10,
      attack: 6,
      defense: 2,
      speed: 5,
    });
    const b = makeCombatant({
      id: "b",
      hp: 10,
      attack: 5,
      defense: 3,
      speed: 3,
    });

    const result = simulateBattle(a, b);

    expect(
      result.turns.map((t) => [t.attackerId, t.defenderId, t.defenderHpAfter]),
    ).toEqual([
      ["a", "b", 7],
      ["b", "a", 7],
      ["a", "b", 4],
      ["b", "a", 4],
      ["a", "b", 1],
      ["b", "a", 1],
      ["a", "b", 0],
    ]);
    expect(result.winnerId).toBe("a");
    expect(result.totalTurns).toBe(7);
  });
});
