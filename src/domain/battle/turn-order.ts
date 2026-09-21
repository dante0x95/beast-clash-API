import { type Combatant } from "./types.js";

export interface TurnOrder<T> {
  first: T;
  second: T;
}

/**
 * Higher speed attacks first; on equal speed, higher attack goes first.
 * On a full tie, `a` goes first (deterministic by argument order).
 */
export function resolveTurnOrder<T extends Pick<Combatant, "attack" | "speed">>(
  a: T,
  b: T,
): TurnOrder<T> {
  const bGoesFirst = b.speed > a.speed || (b.speed === a.speed && b.attack > a.attack);

  return bGoesFirst ? { first: b, second: a } : { first: a, second: b };
}
