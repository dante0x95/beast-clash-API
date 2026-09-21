import { type Combatant } from "./types.js";

export const MIN_DAMAGE = 1;

export function calculateDamage(
  attacker: Pick<Combatant, "attack">,
  defender: Pick<Combatant, "defense">,
): number {
  return Math.max(attacker.attack - defender.defense, MIN_DAMAGE);
}
