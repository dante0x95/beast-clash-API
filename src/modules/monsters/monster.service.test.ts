import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "../../shared/errors/app-error.js";
import {
  makeMonster,
  makeMonsterInput,
  makeMonsterRepository,
} from "./monster.fixture.js";
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

describe("MonsterService", () => {
  describe("create", () => {
    it("persists the input and returns the DTO", async () => {
      const create = vi.fn<MonsterRepository["create"]>(() =>
        Promise.resolve(monster),
      );
      const input = makeMonsterInput();

      await expect(
        createMonsterService(makeMonsterRepository({ create })).create(input),
      ).resolves.toEqual(expectedDto);
      expect(create).toHaveBeenCalledWith(input);
    });
  });

  describe("getById", () => {
    it("returns the DTO when the monster exists", async () => {
      const repository = makeMonsterRepository({
        findById: () => Promise.resolve(monster),
      });

      await expect(
        createMonsterService(repository).getById(monster.id),
      ).resolves.toEqual(expectedDto);
    });

    it("throws NotFoundError when the monster does not exist", async () => {
      const service = createMonsterService(makeMonsterRepository());

      await expect(service.getById(monster.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe("list", () => {
    it("maps every item to a DTO and keeps the pagination metadata", async () => {
      const repository = makeMonsterRepository({
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
      const repository = makeMonsterRepository({
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
      const service = createMonsterService(makeMonsterRepository());

      await expect(service.update(monster.id, { hp: 999 })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("remove", () => {
    it("resolves when the monster was deleted", async () => {
      const repository = makeMonsterRepository({
        softDelete: () => Promise.resolve(true),
      });

      await expect(
        createMonsterService(repository).remove(monster.id),
      ).resolves.toBeUndefined();
    });

    it("throws NotFoundError when the monster does not exist", async () => {
      const service = createMonsterService(makeMonsterRepository());

      await expect(service.remove(monster.id)).rejects.toThrow(NotFoundError);
    });
  });
});

describe("toMonsterDto (via service)", () => {
  it("never leaks fields outside the public contract", async () => {
    const withExtra = { ...monster, deletedAt: new Date(), secret: "x" };
    const repository = makeMonsterRepository({
      findById: () => Promise.resolve(withExtra),
    });

    const dto = await createMonsterService(repository).getById(monster.id);

    expect(Object.keys(dto).sort()).toEqual(Object.keys(expectedDto).sort());
  });
});
