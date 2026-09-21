import { NotFoundError } from "../../shared/errors/app-error.js";
import { type Page, type PageRequest } from "../../shared/pagination.js";
import { type MonsterDto, toMonsterDto } from "./monster.dto.js";
import { type MonsterRepository } from "./monster.repository.js";
import {
  type CreateMonsterInput,
  type UpdateMonsterInput,
} from "./monster.schemas.js";

export interface MonsterService {
  create(input: CreateMonsterInput): Promise<MonsterDto>;
  getById(id: string): Promise<MonsterDto>;
  list(request: PageRequest): Promise<Page<MonsterDto>>;
  update(id: string, input: UpdateMonsterInput): Promise<MonsterDto>;
  remove(id: string): Promise<void>;
}

const RESOURCE = "Monster";

export function createMonsterService(
  repository: MonsterRepository,
): MonsterService {
  return {
    async create(input) {
      return toMonsterDto(await repository.create(input));
    },

    async getById(id) {
      const monster = await repository.findById(id);
      if (!monster) throw new NotFoundError(RESOURCE, id);

      return toMonsterDto(monster);
    },

    async list(request) {
      const page = await repository.list(request);

      return { ...page, items: page.items.map(toMonsterDto) };
    },

    async update(id, input) {
      const monster = await repository.update(id, input);
      if (!monster) throw new NotFoundError(RESOURCE, id);

      return toMonsterDto(monster);
    },

    async remove(id) {
      const deleted = await repository.softDelete(id);
      if (!deleted) throw new NotFoundError(RESOURCE, id);
    },
  };
}
