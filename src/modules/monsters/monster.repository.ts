import { type Page, type PageRequest } from "../../shared/pagination.js";
import {
  type CreateMonsterInput,
  type UpdateMonsterInput,
} from "./monster.schemas.js";
import { type Monster } from "./monster.types.js";

/** Persistence contract for monsters. Soft-deleted monsters are invisible to every method. */
export interface MonsterRepository {
  create(input: CreateMonsterInput): Promise<Monster>;
  findById(id: string): Promise<Monster | null>;
  list(request: PageRequest): Promise<Page<Monster>>;
  /** Returns `null` when the monster does not exist or was deleted. */
  update(id: string, input: UpdateMonsterInput): Promise<Monster | null>;
  /** Returns `false` when the monster does not exist or was already deleted. */
  softDelete(id: string): Promise<boolean>;
}
