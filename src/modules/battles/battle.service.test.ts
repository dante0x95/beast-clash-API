import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "../../shared/errors/app-error.js";
import {
  makeMonster,
  makeMonsterRepository,
} from "../monsters/monster.fixture.js";
import { type Monster } from "../monsters/monster.types.js";
import {
  BATTLE_ID,
  makeBattle,
  makeBattleRepository,
} from "./battle.fixture.js";
import { type BattleRepository } from "./battle.repository.js";
import { createBattleService } from "./battle.service.js";

const ID_A = "01926f3e-8c2a-7b3d-9e4f-5a6b7c8d9e0a";
const ID_B = "01926f3e-8c2a-7b3d-9e4f-5a6b7c8d9e0b";

// striker deals 200 - 25 = 175 damage and is faster: one-turn knockout
const striker = makeMonster({
  id: ID_A,
  name: "Striker",
  attack: 200,
  speed: 10,
});
const target = makeMonster({
  id: ID_B,
  name: "Target",
  hp: 120,
  defense: 25,
  speed: 5,
});

function findIn(...monsters: Monster[]) {
  return (id: string) =>
    Promise.resolve(monsters.find((m) => m.id === id) ?? null);
}

describe("BattleService", () => {
  describe("create", () => {
    it("simulates the battle with the real engine and persists result plus snapshots", async () => {
      const create = vi.fn<BattleRepository["create"]>((battle) =>
        Promise.resolve({
          ...battle,
          id: BATTLE_ID,
          createdAt: new Date("2026-01-03T00:00:00.000Z"),
        }),
      );
      const service = createBattleService({
        battleRepository: makeBattleRepository({ create }),
        monsterRepository: makeMonsterRepository({
          findById: findIn(striker, target),
        }),
      });

      const dto = await service.create({ monsterAId: ID_A, monsterBId: ID_B });

      expect(create).toHaveBeenCalledWith({
        monsterA: {
          id: ID_A,
          snapshot: {
            name: "Striker",
            imageUrl: striker.imageUrl,
            hp: 120,
            attack: 200,
            defense: 25,
            speed: 10,
          },
        },
        monsterB: {
          id: ID_B,
          snapshot: {
            name: "Target",
            imageUrl: target.imageUrl,
            hp: 120,
            attack: 40,
            defense: 25,
            speed: 5,
          },
        },
        winnerId: ID_A,
        loserId: ID_B,
        totalTurns: 1,
        turns: [
          {
            turn: 1,
            attackerId: ID_A,
            defenderId: ID_B,
            damage: 175,
            defenderHpAfter: 0,
          },
        ],
      });
      expect(dto).toMatchObject({
        id: BATTLE_ID,
        winnerId: ID_A,
        createdAt: "2026-01-03T00:00:00.000Z",
      });
    });

    it("keeps the request order for monster A and B even when B attacks first", async () => {
      const create = vi.fn<BattleRepository["create"]>((battle) =>
        Promise.resolve({ ...battle, id: BATTLE_ID, createdAt: new Date() }),
      );
      const service = createBattleService({
        battleRepository: makeBattleRepository({ create }),
        monsterRepository: makeMonsterRepository({
          findById: findIn(striker, target),
        }),
      });

      const dto = await service.create({ monsterAId: ID_B, monsterBId: ID_A });

      expect(dto.monsterA.id).toBe(ID_B);
      expect(dto.turns[0]?.attackerId).toBe(ID_A);
    });

    it.each([
      ["monster A", { monsterAId: ID_A, monsterBId: ID_B }, target, ID_A],
      ["monster B", { monsterAId: ID_A, monsterBId: ID_B }, striker, ID_B],
    ])(
      "throws NotFoundError naming %s when it does not exist",
      async (_, input, existing, missingId) => {
        const create = vi.fn<BattleRepository["create"]>();
        const service = createBattleService({
          battleRepository: makeBattleRepository({ create }),
          monsterRepository: makeMonsterRepository({
            findById: findIn(existing),
          }),
        });

        await expect(service.create(input)).rejects.toThrow(
          new NotFoundError("Monster", missingId),
        );
        expect(create).not.toHaveBeenCalled();
      },
    );
  });

  describe("getById", () => {
    it("returns the battle DTO with its turns", async () => {
      const service = createBattleService({
        battleRepository: makeBattleRepository({
          findById: () => Promise.resolve(makeBattle(ID_A, ID_B)),
        }),
        monsterRepository: makeMonsterRepository(),
      });

      const dto = await service.getById(BATTLE_ID);

      expect(dto).toMatchObject({
        id: BATTLE_ID,
        monsterA: { id: ID_A, name: "Striker" },
        monsterB: { id: ID_B, name: "Target" },
        totalTurns: 1,
      });
      expect(dto.turns).toHaveLength(1);
    });

    it("throws NotFoundError when the battle does not exist", async () => {
      const service = createBattleService({
        battleRepository: makeBattleRepository(),
        monsterRepository: makeMonsterRepository(),
      });

      await expect(service.getById(BATTLE_ID)).rejects.toThrow(NotFoundError);
    });
  });

  describe("list", () => {
    it("maps summaries without turns and keeps the pagination metadata", async () => {
      const { turns: _turns, ...summary } = makeBattle(ID_A, ID_B);
      const service = createBattleService({
        battleRepository: makeBattleRepository({
          list: () =>
            Promise.resolve({
              items: [summary],
              total: 1,
              page: 1,
              pageSize: 20,
            }),
        }),
        monsterRepository: makeMonsterRepository(),
      });

      const page = await service.list({ page: 1, pageSize: 20 });

      expect(page).toMatchObject({ total: 1, page: 1, pageSize: 20 });
      expect(page.items[0]).not.toHaveProperty("turns");
    });
  });

  describe("remove", () => {
    it("resolves when the battle was deleted", async () => {
      const service = createBattleService({
        battleRepository: makeBattleRepository({
          delete: () => Promise.resolve(true),
        }),
        monsterRepository: makeMonsterRepository(),
      });

      await expect(service.remove(BATTLE_ID)).resolves.toBeUndefined();
    });

    it("throws NotFoundError when the battle does not exist", async () => {
      const service = createBattleService({
        battleRepository: makeBattleRepository(),
        monsterRepository: makeMonsterRepository(),
      });

      await expect(service.remove(BATTLE_ID)).rejects.toThrow(NotFoundError);
    });
  });
});
