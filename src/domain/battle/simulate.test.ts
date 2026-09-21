import { describe, expect, it } from "vitest";

import { makeCombatant } from "./combatant.fixture.js";
import { InvalidCombatantError } from "./errors.js";
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

  it("never reports negative hp and ends the last turn at exactly 0", () => {
    // a deals 9 - 2 = 7 per hit: b goes 10 -> 3 -> 0 (would be -4 without clamping)
    const a = makeCombatant({
      id: "a",
      hp: 10,
      attack: 9,
      defense: 2,
      speed: 5,
    });
    const b = makeCombatant({
      id: "b",
      hp: 10,
      attack: 5,
      defense: 2,
      speed: 3,
    });

    const { turns } = simulateBattle(a, b);

    expect(turns.every((t) => t.defenderHpAfter >= 0)).toBe(true);
    expect(turns.at(-1)?.defenderHpAfter).toBe(0);
    // damage reports the full hit, even when it exceeds the remaining hp
    expect(turns.at(-1)?.damage).toBe(7);
  });

  it("lets a slower but stronger combatant win", () => {
    // fast deals 8 - 5 = 3 per hit, slow deals 20 - 5 = 15 per hit
    const fast = makeCombatant({
      id: "fast",
      hp: 20,
      attack: 8,
      defense: 5,
      speed: 9,
    });
    const slow = makeCombatant({
      id: "slow",
      hp: 30,
      attack: 20,
      defense: 5,
      speed: 1,
    });

    const result = simulateBattle(fast, slow);

    expect(result.turns[0]?.attackerId).toBe("fast");
    expect(result.winnerId).toBe("slow");
    expect(result.totalTurns).toBe(4);
  });

  it("still terminates when both sides only deal minimum damage", () => {
    // defense exceeds attack on both sides, so every hit deals MIN_DAMAGE
    const a = makeCombatant({ id: "a", hp: 3, attack: 1, defense: 10 });
    const b = makeCombatant({ id: "b", hp: 3, attack: 1, defense: 10 });

    const result = simulateBattle(a, b);

    expect(result.turns.every((t) => t.damage === 1)).toBe(true);
    // worst case bound: hpA + hpB - 1 turns
    expect(result.totalTurns).toBe(5);
    expect(result.winnerId).toBe("a");
  });

  it("returns a result consistent with its turn log", () => {
    const a = makeCombatant({
      id: "a",
      hp: 12,
      attack: 7,
      defense: 3,
      speed: 4,
    });
    const b = makeCombatant({
      id: "b",
      hp: 15,
      attack: 6,
      defense: 2,
      speed: 6,
    });

    const result = simulateBattle(a, b);
    const lastTurn = result.turns.at(-1);

    expect(result.totalTurns).toBe(result.turns.length);
    expect(result.turns.map((t) => t.turn)).toEqual(
      Array.from({ length: result.totalTurns }, (_, i) => i + 1),
    );
    expect(result.winnerId).toBe(lastTurn?.attackerId);
    expect(result.loserId).toBe(lastTurn?.defenderId);
  });

  it("does not mutate its inputs", () => {
    const a = Object.freeze(makeCombatant({ id: "a", attack: 8 }));
    const b = Object.freeze(makeCombatant({ id: "b", attack: 6 }));

    // frozen objects throw on assignment in strict mode (ESM), so any mutation fails the test
    expect(() => simulateBattle(a, b)).not.toThrow();
    expect(a.hp).toBe(10);
    expect(b.hp).toBe(10);
  });

  describe("invalid input", () => {
    it.each([
      ["hp is zero", { hp: 0 }],
      ["hp is negative", { hp: -5 }],
      ["hp is not an integer", { hp: 10.5 }],
      ["attack is negative", { attack: -1 }],
      ["defense is negative", { defense: -1 }],
      ["speed is negative", { speed: -1 }],
      ["a stat is not an integer", { speed: 2.5 }],
      ["a stat is NaN", { attack: Number.NaN }],
    ])("throws InvalidCombatantError when %s", (_, overrides) => {
      const invalid = makeCombatant({ id: "invalid", ...overrides });
      const valid = makeCombatant({ id: "valid" });

      expect(() => simulateBattle(invalid, valid)).toThrow(
        InvalidCombatantError,
      );
      expect(() => simulateBattle(valid, invalid)).toThrow(
        InvalidCombatantError,
      );
    });

    it("throws InvalidCombatantError when both combatants share the same id", () => {
      const a = makeCombatant({ id: "same" });
      const b = makeCombatant({ id: "same" });

      expect(() => simulateBattle(a, b)).toThrow(InvalidCombatantError);
    });
  });
});
