import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { createApp } from "../../app.js";
import { NotFoundError } from "../../shared/errors/app-error.js";
import { makeAppDeps } from "../../testing/app.fixture.js";
import { toBattleDto, toBattleSummaryDto } from "./battle.dto.js";
import { makeBattleService } from "./battle.fixture.js";
import { BATTLE_ID, makeBattle } from "./battle.fixture.js";
import { type BattleService } from "./battle.service.js";

const ID_A = "01926f3e-8c2a-7b3d-9e4f-5a6b7c8d9e0a";
const ID_B = "01926f3e-8c2a-7b3d-9e4f-5a6b7c8d9e0b";

const battle = makeBattle(ID_A, ID_B);
const dto = toBattleDto(battle);
const summaryDto = toBattleSummaryDto(battle);

function appWith(overrides: Partial<BattleService> = {}) {
  return createApp(
    makeAppDeps({ battleService: makeBattleService(overrides) }),
  );
}

describe("battle routes", () => {
  describe("POST /battles", () => {
    it("creates the battle and returns 201 with a Location header", async () => {
      const create = vi.fn<BattleService["create"]>(() => Promise.resolve(dto));

      const res = await request(appWith({ create }))
        .post("/battles")
        .send({ monsterAId: ID_A, monsterBId: ID_B });

      expect(res.status).toBe(201);
      expect(res.headers.location).toBe(`/battles/${BATTLE_ID}`);
      expect(res.body).toEqual(dto);
      expect(create).toHaveBeenCalledWith({
        monsterAId: ID_A,
        monsterBId: ID_B,
      });
    });

    it("returns 400 on monsterBId when a monster battles itself", async () => {
      const create = vi.fn<BattleService["create"]>();

      const res = await request(appWith({ create }))
        .post("/battles")
        .send({ monsterAId: ID_A, monsterBId: ID_A });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        error: { code: "VALIDATION_ERROR", issues: [{ path: "monsterBId" }] },
      });
      expect(create).not.toHaveBeenCalled();
    });

    it("returns 400 when an id is not a UUID", async () => {
      const res = await request(appWith())
        .post("/battles")
        .send({ monsterAId: "123", monsterBId: ID_B });

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        error: { code: "VALIDATION_ERROR", issues: [{ path: "monsterAId" }] },
      });
    });

    it("returns 400 when the body has unknown fields", async () => {
      const res = await request(appWith())
        .post("/battles")
        .send({ monsterAId: ID_A, monsterBId: ID_B, winnerId: ID_A });

      expect(res.status).toBe(400);
    });

    it("returns 404 when a monster does not exist", async () => {
      const res = await request(
        appWith({
          create: () => Promise.reject(new NotFoundError("Monster", ID_B)),
        }),
      )
        .post("/battles")
        .send({ monsterAId: ID_A, monsterBId: ID_B });

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        error: { code: "NOT_FOUND", message: `Monster ${ID_B} not found` },
      });
    });
  });

  describe("GET /battles", () => {
    it("applies default pagination", async () => {
      const list = vi.fn<BattleService["list"]>(({ page, pageSize }) =>
        Promise.resolve({ items: [summaryDto], total: 1, page, pageSize }),
      );

      const res = await request(appWith({ list })).get("/battles");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        items: [summaryDto],
        total: 1,
        page: 1,
        pageSize: 20,
      });
      expect(list).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    });

    it("coerces the pagination query", async () => {
      const list = vi.fn<BattleService["list"]>(({ page, pageSize }) =>
        Promise.resolve({ items: [], total: 0, page, pageSize }),
      );

      await request(appWith({ list }))
        .get("/battles?page=2&pageSize=5")
        .expect(200);

      expect(list).toHaveBeenCalledWith({ page: 2, pageSize: 5 });
    });

    it("returns 400 when the pagination query is invalid", async () => {
      const res = await request(appWith()).get("/battles?page=0");

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    });
  });

  describe("GET /battles/:id", () => {
    it("returns the battle with its turns", async () => {
      const res = await request(
        appWith({ getById: () => Promise.resolve(dto) }),
      ).get(`/battles/${BATTLE_ID}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(dto);
    });

    it("returns 404 when the battle does not exist", async () => {
      const res = await request(appWith()).get(`/battles/${BATTLE_ID}`);

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ error: { code: "NOT_FOUND" } });
    });

    it("returns 400 without calling the service when the id is not a UUID", async () => {
      const getById = vi.fn<BattleService["getById"]>();

      const res = await request(appWith({ getById })).get("/battles/123");

      expect(res.status).toBe(400);
      expect(getById).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /battles/:id", () => {
    it("returns 204 with an empty body", async () => {
      const remove = vi.fn<BattleService["remove"]>(() => Promise.resolve());

      const res = await request(appWith({ remove })).delete(
        `/battles/${BATTLE_ID}`,
      );

      expect(res.status).toBe(204);
      expect(res.text).toBe("");
      expect(remove).toHaveBeenCalledWith(BATTLE_ID);
    });

    it("returns 404 when the battle does not exist", async () => {
      const res = await request(appWith()).delete(`/battles/${BATTLE_ID}`);

      expect(res.status).toBe(404);
    });
  });
});
