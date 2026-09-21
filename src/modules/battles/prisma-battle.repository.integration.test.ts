import { beforeEach, describe, expect, it } from "vitest";

import { testPrisma } from "../../testing/integration/database.js";
import { makeMonsterInput } from "../monsters/monster.fixture.js";
import { makeNewBattle } from "./battle.fixture.js";
import { createPrismaBattleRepository } from "./prisma-battle.repository.js";

const repository = createPrismaBattleRepository(testPrisma);
const UNKNOWN_ID = "01926f3e-8c2a-7b3d-9e4f-5a6b7c8d9e0f";

let monsterAId: string;
let monsterBId: string;

// battles reference real monsters through foreign keys
beforeEach(async () => {
  const [a, b] = await Promise.all([
    testPrisma.monster.create({ data: makeMonsterInput({ name: "Striker" }) }),
    testPrisma.monster.create({ data: makeMonsterInput({ name: "Target" }) }),
  ]);
  monsterAId = a.id;
  monsterBId = b.id;
});

describe("PrismaBattleRepository (integration)", () => {
  describe("create", () => {
    it("persists the battle and returns it with typed snapshots and turns", async () => {
      const newBattle = makeNewBattle(monsterAId, monsterBId);

      const battle = await repository.create(newBattle);

      expect(battle).toMatchObject(newBattle);
      expect(battle.id).toEqual(expect.any(String));
      expect(battle.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("findById", () => {
    it("returns the full battle, including its turn log", async () => {
      const created = await repository.create(
        makeNewBattle(monsterAId, monsterBId),
      );

      await expect(repository.findById(created.id)).resolves.toEqual(created);
    });

    it("returns null when the battle does not exist", async () => {
      await expect(repository.findById(UNKNOWN_ID)).resolves.toBeNull();
    });

    it("fails loudly when a stored snapshot is corrupted", async () => {
      const created = await repository.create(
        makeNewBattle(monsterAId, monsterBId),
      );
      // bypass the repository to simulate a row damaged outside the API
      await testPrisma.battle.update({
        where: { id: created.id },
        data: { snapshotA: { name: "Striker" } },
      });

      await expect(repository.findById(created.id)).rejects.toThrow();
    });
  });

  describe("list", () => {
    it("returns summaries without turns, newest first, with the total count", async () => {
      const older = await repository.create(
        makeNewBattle(monsterAId, monsterBId),
      );
      const newer = await repository.create(
        makeNewBattle(monsterBId, monsterAId),
      );

      const page = await repository.list({ page: 1, pageSize: 10 });

      expect(page).toMatchObject({ total: 2, page: 1, pageSize: 10 });
      expect(page.items.map((b) => b.id)).toEqual([newer.id, older.id]);
      expect(page.items[0]).not.toHaveProperty("turns");
    });

    it("paginates", async () => {
      await repository.create(makeNewBattle(monsterAId, monsterBId));
      const newest = await repository.create(
        makeNewBattle(monsterBId, monsterAId),
      );

      const page = await repository.list({ page: 1, pageSize: 1 });

      expect(page.items.map((b) => b.id)).toEqual([newest.id]);
      expect(page.total).toBe(2);
    });
  });

  describe("delete", () => {
    it("removes the battle and leaves its monsters untouched", async () => {
      const created = await repository.create(
        makeNewBattle(monsterAId, monsterBId),
      );

      await expect(repository.delete(created.id)).resolves.toBe(true);

      await expect(repository.findById(created.id)).resolves.toBeNull();
      await expect(testPrisma.monster.count()).resolves.toBe(2);
    });

    it("returns false when the battle does not exist", async () => {
      await expect(repository.delete(UNKNOWN_ID)).resolves.toBe(false);
    });
  });

  it("rejects an inconsistent battle through the database check constraints", async () => {
    const inconsistent = {
      ...makeNewBattle(monsterAId, monsterBId),
      totalTurns: 5,
    };

    await expect(repository.create(inconsistent)).rejects.toThrow(
      /battles_turns_match_total/,
    );
  });
});
