import { type BattleTurn } from "../../domain/battle/types.js";
import {
  type Battle,
  type BattleParticipant,
  type BattleSummary,
} from "./battle.types.js";

/** A participant flattened for the client: id plus the stats it fought with. */
export interface BattleParticipantDto {
  id: string;
  name: string;
  imageUrl: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface BattleSummaryDto {
  id: string;
  monsterA: BattleParticipantDto;
  monsterB: BattleParticipantDto;
  winnerId: string;
  loserId: string;
  totalTurns: number;
  createdAt: string;
}

export interface BattleDto extends BattleSummaryDto {
  turns: BattleTurn[];
}

function toParticipantDto({
  id,
  snapshot,
}: BattleParticipant): BattleParticipantDto {
  return {
    id,
    name: snapshot.name,
    imageUrl: snapshot.imageUrl,
    hp: snapshot.hp,
    attack: snapshot.attack,
    defense: snapshot.defense,
    speed: snapshot.speed,
  };
}

export function toBattleSummaryDto(battle: BattleSummary): BattleSummaryDto {
  return {
    id: battle.id,
    monsterA: toParticipantDto(battle.monsterA),
    monsterB: toParticipantDto(battle.monsterB),
    winnerId: battle.winnerId,
    loserId: battle.loserId,
    totalTurns: battle.totalTurns,
    createdAt: battle.createdAt.toISOString(),
  };
}

export function toBattleDto(battle: Battle): BattleDto {
  return {
    ...toBattleSummaryDto(battle),
    turns: battle.turns.map((turn) => ({
      turn: turn.turn,
      attackerId: turn.attackerId,
      defenderId: turn.defenderId,
      damage: turn.damage,
      defenderHpAfter: turn.defenderHpAfter,
    })),
  };
}
