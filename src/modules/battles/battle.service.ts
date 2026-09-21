import { simulateBattle } from "../../domain/battle/simulate.js";
import { type Combatant } from "../../domain/battle/types.js";
import { NotFoundError } from "../../shared/errors/app-error.js";
import { type Page, type PageRequest } from "../../shared/pagination.js";
import { type MonsterRepository } from "../monsters/monster.repository.js";
import { type Monster } from "../monsters/monster.types.js";
import {
  type BattleDto,
  type BattleSummaryDto,
  toBattleDto,
  toBattleSummaryDto,
} from "./battle.dto.js";
import { type BattleRepository } from "./battle.repository.js";
import {
  type BattleSnapshot,
  type CreateBattleInput,
} from "./battle.schemas.js";

export interface BattleService {
  create(input: CreateBattleInput): Promise<BattleDto>;
  getById(id: string): Promise<BattleDto>;
  list(request: PageRequest): Promise<Page<BattleSummaryDto>>;
  remove(id: string): Promise<void>;
}

export interface BattleServiceDeps {
  battleRepository: BattleRepository;
  monsterRepository: MonsterRepository;
}

function toCombatant(monster: Monster): Combatant {
  return {
    id: monster.id,
    hp: monster.hp,
    attack: monster.attack,
    defense: monster.defense,
    speed: monster.speed,
  };
}

function toSnapshot(monster: Monster): BattleSnapshot {
  return {
    name: monster.name,
    imageUrl: monster.imageUrl,
    hp: monster.hp,
    attack: monster.attack,
    defense: monster.defense,
    speed: monster.speed,
  };
}

export function createBattleService({
  battleRepository,
  monsterRepository,
}: BattleServiceDeps): BattleService {
  return {
    async create({ monsterAId, monsterBId }) {
      const [monsterA, monsterB] = await Promise.all([
        monsterRepository.findById(monsterAId),
        monsterRepository.findById(monsterBId),
      ]);
      // soft-deleted monsters are invisible to the repository, so they cannot battle
      if (!monsterA) throw new NotFoundError("Monster", monsterAId);
      if (!monsterB) throw new NotFoundError("Monster", monsterBId);

      // argument order matters: on a full tie, monster A attacks first
      const result = simulateBattle(
        toCombatant(monsterA),
        toCombatant(monsterB),
      );

      const battle = await battleRepository.create({
        monsterA: { id: monsterA.id, snapshot: toSnapshot(monsterA) },
        monsterB: { id: monsterB.id, snapshot: toSnapshot(monsterB) },
        winnerId: result.winnerId,
        loserId: result.loserId,
        totalTurns: result.totalTurns,
        turns: result.turns,
      });

      return toBattleDto(battle);
    },

    async getById(id) {
      const battle = await battleRepository.findById(id);
      if (!battle) throw new NotFoundError("Battle", id);

      return toBattleDto(battle);
    },

    async list(request) {
      const page = await battleRepository.list(request);

      return { ...page, items: page.items.map(toBattleSummaryDto) };
    },

    async remove(id) {
      const deleted = await battleRepository.delete(id);
      if (!deleted) throw new NotFoundError("Battle", id);
    },
  };
}
