import { describe, expect, it } from "vitest";

import { testPrisma } from "../../testing/integration/database.js";
import { makeMonsterInput } from "./monster.fixture.js";
import { createPrismaMonsterRepository } from "./prisma-monster.repository.js";

const repository = createPrismaMonsterRepository(testPrisma);
const UNKNOWN_ID = "01926f3e-8c2a-7b3d-9e4f-5a6b7c8d9e0f";

describe("PrismaMonsterRepository (integration)", () => {
  describe("create", () => {
    it("persists the monster and returns it without soft-delete metadata", async () => {
      const monster = await repository.create(makeMonsterInput());

      expect(monster).toMatchObject(makeMonsterInput());
      expect(monster.id).toEqual(expect.any(String));
      expect(monster.createdAt).toBeInstanceOf(Date);
      expect(monster).not.toHaveProperty("deletedAt");
    });
  });

  describe("findById", () => {
    it("returns the monster when it exists", async () => {
      const created = await repository.create(makeMonsterInput());

      await expect(repository.findById(created.id)).resolves.toEqual(created);
    });

    it("returns null when the monster does not exist", async () => {
      await expect(repository.findById(UNKNOWN_ID)).resolves.toBeNull();
    });
  });

  describe("list", () => {
    it("returns a page of monsters, newest first, with the total count", async () => {
      const first = await repository.create(
        makeMonsterInput({ name: "First" }),
      );
      const second = await repository.create(
        makeMonsterInput({ name: "Second" }),
      );
      const third = await repository.create(
        makeMonsterInput({ name: "Third" }),
      );

      const pageOne = await repository.list({ page: 1, pageSize: 2 });
      const pageTwo = await repository.list({ page: 2, pageSize: 2 });

      expect(pageOne.items.map((m) => m.id)).toEqual([third.id, second.id]);
      expect(pageTwo.items.map((m) => m.id)).toEqual([first.id]);
      expect(pageOne).toMatchObject({ total: 3, page: 1, pageSize: 2 });
    });

    it("returns an empty page past the last one", async () => {
      await repository.create(makeMonsterInput());

      const page = await repository.list({ page: 5, pageSize: 10 });

      expect(page).toEqual({ items: [], total: 1, page: 5, pageSize: 10 });
    });
  });

  describe("update", () => {
    it("changes only the provided fields", async () => {
      const created = await repository.create(makeMonsterInput());

      const updated = await repository.update(created.id, {
        hp: 999,
        speed: undefined,
      });

      expect(updated).toMatchObject({ ...makeMonsterInput(), hp: 999 });
      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime(),
      );
    });

    it("returns null when the monster does not exist", async () => {
      await expect(
        repository.update(UNKNOWN_ID, { hp: 10 }),
      ).resolves.toBeNull();
    });
  });

  describe("softDelete", () => {
    it("hides the monster from every read and write while keeping the row", async () => {
      const created = await repository.create(makeMonsterInput());

      await expect(repository.softDelete(created.id)).resolves.toBe(true);

      await expect(repository.findById(created.id)).resolves.toBeNull();
      await expect(
        repository.list({ page: 1, pageSize: 10 }),
      ).resolves.toMatchObject({ items: [], total: 0 });
      await expect(
        repository.update(created.id, { hp: 10 }),
      ).resolves.toBeNull();
      await expect(repository.softDelete(created.id)).resolves.toBe(false);

      const row = await testPrisma.monster.findUnique({
        where: { id: created.id },
      });
      expect(row?.deletedAt).toBeInstanceOf(Date);
    });

    it("returns false when the monster does not exist", async () => {
      await expect(repository.softDelete(UNKNOWN_ID)).resolves.toBe(false);
    });
  });
});
