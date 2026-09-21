import { type Page, type PageRequest } from "../../shared/pagination.js";
import {
  type Battle,
  type BattleSummary,
  type NewBattle,
} from "./battle.types.js";

/** Persistence contract for battles. Battles are immutable: created or deleted, never updated. */
export interface BattleRepository {
  create(battle: NewBattle): Promise<Battle>;
  findById(id: string): Promise<Battle | null>;
  /** Summaries only: the turn log is omitted to keep history listings light. */
  list(request: PageRequest): Promise<Page<BattleSummary>>;
  /** Hard delete. Returns `false` when the battle does not exist. */
  delete(id: string): Promise<boolean>;
}
