import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "../../shared/errors/app-error.js";
import { makeMonster, makeMonsterInput } from "./monster.fixture.js";
import { type MonsterRepository } from "./monster.repository.js";
import { createMonsterService } from "./monster.service.js";

const monster = makeMonster();

const expectedDto = {
  id: monster.id,
  name: "Pyrodrake",
  hp: 120,
  attack: 40,
  defense: 25,
  speed: 30,
  imageUrl: "https://example.com/pyrodrake.png",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

/** Stub repository: every method resolves to "not found" unless the test overrides it. */
function makeRepository(
  overrides: Partial<MonsterRepository> = {},
): MonsterRepository {
  return {
    create: () => Promise.resolve(monster),
    findById: () => Promise.resolve(null),
    list: ({ page, pageSize }) =>
      Promise.resolve({ items: [], total: 0, page, pageSize }),
    update: () => Promise.resolve(null),
    softDelete: () => Promise.resolve(false),
    ...overrides,
  };
}

describe("MonsterService", () => {
  describe("create", () => {
    it("persists the input and returns the DTO", async () => {
      const create = vi.fn<MonsterRepository["create"]>(() =>
        Promise.resolve(monster),
      );
      const input = makeMonsterInput();

      await expect(
        createMonsterService(makeRepository({ create })).create(input),
      ).resolves.toEqual(expectedDto);
      expect(create).toHaveBeenCalledWith(input);
    });
  });

  describe("getById", () => {
    it("returns the DTO when the monster exists", async () => {
      const repository = makeRepository({
        findById: () => Promise.resolve(monster),
      });

      await expect(
        createMonsterService(repository).getById(monster.id),
      ).resolves.toEqual(expectedDto);
    });

    it("throws NotFoundError when the monster does not exist", async () => {
      const service = createMonsterService(makeRepository());

      await expect(service.getById(monster.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe("list", () => {
    it("maps every item to a DTO and keeps the pagination metadata", async () => {
      const repository = makeRepository({
        list: () =>
          Promise.resolve({
            items: [monster],
            total: 21,
            page: 2,
            pageSize: 20,
          }),
      });

      await expect(
        createMonsterService(repository).list({ page: 2, pageSize: 20 }),
      ).resolves.toEqual({
        items: [expectedDto],
        total: 21,
        page: 2,
        pageSize: 20,
      });
    });
  });

  describe("update", () => {
    it("returns the updated DTO when the monster exists", async () => {
      const updated = makeMonster({ hp: 999 });
      const repository = makeRepository({
        update: () => Promise.resolve(updated),
      });

      await expect(
        createMonsterService(repository).update(monster.id, { hp: 999 }),
      ).resolves.toEqual({
        ...expectedDto,
        hp: 999,
      });
    });

    it("throws NotFoundError when the monster does not exist", async () => {
      const service = createMonsterService(makeRepository());

      await expect(service.update(monster.id, { hp: 999 })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("remove", () => {
    it("resolves when the monster was deleted", async () => {
      const repository = makeRepository({
        softDelete: () => Promise.resolve(true),
      });

      await expect(
        createMonsterService(repository).remove(monster.id),
      ).resolves.toBeUndefined();
    });

    it("throws NotFoundError when the monster does not exist", async () => {
      const service = createMonsterService(makeRepository());

      await expect(service.remove(monster.id)).rejects.toThrow(NotFoundError);
    });
  });
});

describe("toMonsterDto (via service)", () => {
  it("never leaks fields outside the public contract", async () => {
    const withExtra = { ...monster, deletedAt: new Date(), secret: "x" };
    const repository = makeRepository({
      findById: () => Promise.resolve(withExtra),
    });

    const dto = await createMonsterService(repository).getById(monster.id);

    expect(Object.keys(dto).sort()).toEqual(Object.keys(expectedDto).sort());
  });
});
