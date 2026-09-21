import { describe, expect, it } from "vitest";

import { calculateDamage, MIN_DAMAGE } from "./damage.js";

describe("calculateDamage", () => {
  it("returns the difference when attack exceeds defense", () => {
    expect(calculateDamage({ attack: 10 }, { defense: 4 })).toBe(6);
  });

  it("returns minimum damage when attack equals defense", () => {
    expect(calculateDamage({ attack: 5 }, { defense: 5 })).toBe(MIN_DAMAGE);
  });

  it("returns minimum damage when defense exceeds attack", () => {
    expect(calculateDamage({ attack: 3 }, { defense: 8 })).toBe(MIN_DAMAGE);
  });
});
