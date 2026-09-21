import { calculateDamage } from "./damage.js";
import { resolveTurnOrder } from "./turn-order.js";
import { type BattleResult, type BattleTurn, type Combatant } from "./types.js";
import { assertValidMatchup } from "./validation.js";

interface Fighter {
  combatant: Combatant;
  hp: number;
}

/**
 * Runs a turn-based battle until one combatant reaches 0 hp.
 * Always terminates: every hit deals at least MIN_DAMAGE, so hp strictly decreases.
 * Inputs are never mutated; remaining hp is tracked in local state.
 *  @throws {InvalidCombatantError} if a combatant has invalid stats or both share the same id.
 */
export function simulateBattle(a: Combatant, b: Combatant): BattleResult {
  assertValidMatchup(a, b);
  const { first, second } = resolveTurnOrder(a, b);
  let attacker: Fighter = { combatant: first, hp: first.hp };
  let defender: Fighter = { combatant: second, hp: second.hp };
  const turns: BattleTurn[] = [];

  for (let turn = 1; ; turn++) {
    const damage = calculateDamage(attacker.combatant, defender.combatant);
    defender.hp = Math.max(defender.hp - damage, 0);

    turns.push({
      turn,
      attackerId: attacker.combatant.id,
      defenderId: defender.combatant.id,
      damage,
      defenderHpAfter: defender.hp,
    });

    if (defender.hp === 0) {
      return {
        winnerId: attacker.combatant.id,
        loserId: defender.combatant.id,
        totalTurns: turns.length,
        turns,
      };
    }

    [attacker, defender] = [defender, attacker];
  }
}
