import { NotFoundError } from "../../shared/errors/app-error.js";
import { toMonsterDto } from "./monster.dto.js";
import { type MonsterRepository } from "./monster.repository.js";
import { type CreateMonsterInput } from "./monster.schemas.js";
import { type MonsterService } from "./monster.service.js";
import { type Monster } from "./monster.types.js";

/** Builds a valid monster creation payload; override only what the test cares about. */
export function makeMonsterInput(
  overrides: Partial<CreateMonsterInput> = {},
): CreateMonsterInput {
  return {
    name: "Pyrodrake",
    hp: 120,
    attack: 40,
    defense: 25,
    speed: 30,
    imageUrl: "https://example.com/pyrodrake.png",
    ...overrides,
  };
}

/** Builds a persisted monster as returned by the repository. */
export function makeMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: "01926f3e-8c2a-7b3d-9e4f-5a6b7c8d9e0f",
    ...makeMonsterInput(),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    ...overrides,
  };
}

/** Stub service: every lookup fails with NotFoundError unless the test overrides it. */
export function makeMonsterService(
  overrides: Partial<MonsterService> = {},
): MonsterService {
  const notFound = (id: string): Promise<never> =>
    Promise.reject(new NotFoundError("Monster", id));

  return {
    create: () => Promise.resolve(toMonsterDto(makeMonster())),
    getById: notFound,
    list: ({ page, pageSize }) =>
      Promise.resolve({ items: [], total: 0, page, pageSize }),
    update: notFound,
    remove: notFound,
    ...overrides,
  };
}

export function makeMonsterRepository(
  overrides: Partial<MonsterRepository> = {},
): MonsterRepository {
  return {
    create: () => Promise.resolve(makeMonster()),
    findById: () => Promise.resolve(null),
    list: ({ page, pageSize }) =>
      Promise.resolve({ items: [], total: 0, page, pageSize }),
    update: () => Promise.resolve(null),
    softDelete: () => Promise.resolve(false),
    ...overrides,
  };
}
