import { describe, expect, it } from "vitest";

import { makeCombatant } from "./combatant.fixture.js";
import { resolveTurnOrder } from "./turn-order.js";

describe("resolveTurnOrder", () => {
  it("lets the faster combatant attack first", () => {
    const slow = makeCombatant({ id: "slow", speed: 3 });
    const fast = makeCombatant({ id: "fast", speed: 7 });

    expect(resolveTurnOrder(slow, fast)).toEqual({ first: fast, second: slow });
    expect(resolveTurnOrder(fast, slow)).toEqual({ first: fast, second: slow });
  });

  it("breaks a speed tie by higher attack", () => {
    const weak = makeCombatant({ id: "weak", attack: 4, speed: 5 });
    const strong = makeCombatant({ id: "strong", attack: 9, speed: 5 });

    expect(resolveTurnOrder(weak, strong)).toEqual({
      first: strong,
      second: weak,
    });
    expect(resolveTurnOrder(strong, weak)).toEqual({
      first: strong,
      second: weak,
    });
  });

  it("lets the first argument attack first on a full tie", () => {
    const a = makeCombatant({ id: "a" });
    const b = makeCombatant({ id: "b" });

    expect(resolveTurnOrder(a, b)).toEqual({ first: a, second: b });
    expect(resolveTurnOrder(b, a)).toEqual({ first: b, second: a });
  });
});
