import { type Combatant } from "./types.js";

export function makeCombatant(overrides: Partial<Combatant> = {}): Combatant {
  return {
    id: "monster",
    hp: 10,
    attack: 5,
    defense: 5,
    speed: 5,
    ...overrides,
  };
}
