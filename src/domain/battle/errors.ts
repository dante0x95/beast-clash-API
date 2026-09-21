/** Raised when combatants violate the battle engine's preconditions. */
export class InvalidCombatantError extends Error {
  override readonly name = "InvalidCombatantError";
}
