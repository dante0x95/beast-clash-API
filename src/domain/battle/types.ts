export interface Combatant {
  id: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface BattleTurn {
  turn: number;
  attackerId: string;
  defenderId: string;
  damage: number;
  defenderHpAfter: number;
}

export interface BattleResult {
  winnerId: string;
  loserId: string;
  totalTurns: number;
  turns: BattleTurn[];
}
