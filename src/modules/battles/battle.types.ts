import { type BattleTurn } from "../../domain/battle/types.js";
import { type BattleSnapshot } from "./battle.schemas.js";

/** A monster as it was at the moment of the battle. */
export interface BattleParticipant {
  id: string;
  snapshot: BattleSnapshot;
}

/** Battle without its turn log, for history listings. */
export interface BattleSummary {
  id: string;
  monsterA: BattleParticipant;
  monsterB: BattleParticipant;
  winnerId: string;
  loserId: string;
  totalTurns: number;
  createdAt: Date;
}

export interface Battle extends BattleSummary {
  turns: BattleTurn[];
}

/** Everything needed to persist a simulated battle. */
export type NewBattle = Omit<Battle, "id" | "createdAt">;
