import { InvalidCombatantError } from "./errors.js";
import { type Combatant } from "./types.js";

const NON_NEGATIVE_STATS = ["attack", "defense", "speed"] as const;

export function assertValidCombatant(combatant: Combatant): void {
  if (!Number.isInteger(combatant.hp) || combatant.hp <= 0) {
    throw new InvalidCombatantError(
      `${combatant.id}: hp must be a positive integer`,
    );
  }

  for (const stat of NON_NEGATIVE_STATS) {
    const value = combatant[stat];
    if (!Number.isInteger(value) || value < 0) {
      throw new InvalidCombatantError(
        `${combatant.id}: ${stat} must be a non-negative integer`,
      );
    }
  }
}

export function assertValidMatchup(a: Combatant, b: Combatant): void {
  assertValidCombatant(a);
  assertValidCombatant(b);

  if (a.id === b.id) {
    throw new InvalidCombatantError(
      `a combatant cannot battle itself (${a.id})`,
    );
  }
}
