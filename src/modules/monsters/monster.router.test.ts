import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { createApp } from "../../app.js";
import { toMonsterDto } from "./monster.dto.js";
import {
  makeMonster,
  makeMonsterInput,
  makeMonsterService,
} from "./monster.fixture.js";
import { type MonsterService } from "./monster.service.js";

const dto = toMonsterDto(makeMonster());
const VALID_ID = dto.id;

function appWith(overrides: Partial<MonsterService> = {}) {
  return createApp({
    checkDatabase: () => Promise.resolve(),
    monsterService: makeMonsterService(overrides),
  });
}

describe("monster routes", () => {
  describe("POST /monsters", () => {
    it("creates the monster and returns 201 with a Location header", async () => {
      const create = vi.fn<MonsterService["create"]>(() =>
        Promise.resolve(dto),
      );

      const res = await request(appWith({ create }))
        .post("/monsters")
        .send({ ...makeMonsterInput(), name: "  Pyrodrake  " });

      expect(res.status).toBe(201);
      expect(res.headers.location).toBe(`/monsters/${dto.id}`);
      expect(res.body).toEqual(dto);
      // the service receives the parsed input, not the raw body
      expect(create).toHaveBeenCalledWith(makeMonsterInput());
    });

    it("returns 400 with the failing fields when the body is invalid", async () => {
      const create = vi.fn<MonsterService["create"]>();

      const res = await request(appWith({ create }))
        .post("/monsters")
        .send({ ...makeMonsterInput(), hp: 0 });

      expect(res.status).toBe(400);
      // toMatchObject compares arrays by length too, so "hp" must be the only failing field
      expect(res.body).toMatchObject({
        error: { code: "VALIDATION_ERROR", issues: [{ path: "hp" }] },
      });
      expect(create).not.toHaveBeenCalled();
    });

    it("returns 400 when the body is malformed JSON", async () => {
      const res = await request(appWith())
        .post("/monsters")
        .set("Content-Type", "application/json")
        .send("{ not json");

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ error: { code: "INVALID_JSON" } });
    });
  });

  describe("GET /monsters", () => {
    it("applies default pagination", async () => {
      const list = vi.fn<MonsterService["list"]>(({ page, pageSize }) =>
        Promise.resolve({ items: [dto], total: 1, page, pageSize }),
      );

      const res = await request(appWith({ list })).get("/monsters");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        items: [dto],
        total: 1,
        page: 1,
        pageSize: 20,
      });
      expect(list).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    });

    it("returns 400 when the pagination query is invalid", async () => {
      const res = await request(appWith()).get("/monsters?pageSize=500");

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
    });
  });

  describe("GET /monsters/:id", () => {
    it("returns the monster", async () => {
      const res = await request(
        appWith({ getById: () => Promise.resolve(dto) }),
      ).get(`/monsters/${VALID_ID}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(dto);
    });

    it("returns 404 when the monster does not exist", async () => {
      const res = await request(appWith()).get(`/monsters/${VALID_ID}`);

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ error: { code: "NOT_FOUND" } });
    });

    it("returns 400 without calling the service when the id is not a UUID", async () => {
      const getById = vi.fn<MonsterService["getById"]>();

      const res = await request(appWith({ getById })).get("/monsters/123");

      expect(res.status).toBe(400);
      expect(getById).not.toHaveBeenCalled();
    });
  });

  describe("PATCH /monsters/:id", () => {
    it("returns the updated monster", async () => {
      const update = vi.fn<MonsterService["update"]>(() =>
        Promise.resolve({ ...dto, hp: 999 }),
      );

      const res = await request(appWith({ update }))
        .patch(`/monsters/${VALID_ID}`)
        .send({ hp: 999 });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ hp: 999 });
      expect(update).toHaveBeenCalledWith(VALID_ID, { hp: 999 });
    });

    it("returns 400 when the body is empty", async () => {
      const res = await request(appWith())
        .patch(`/monsters/${VALID_ID}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /monsters/:id", () => {
    it("returns 204 with an empty body", async () => {
      const res = await request(
        appWith({ remove: () => Promise.resolve() }),
      ).delete(`/monsters/${VALID_ID}`);

      expect(res.status).toBe(204);
      expect(res.text).toBe("");
    });

    it("returns 404 when the monster does not exist", async () => {
      const res = await request(appWith()).delete(`/monsters/${VALID_ID}`);

      expect(res.status).toBe(404);
    });
  });

  it("returns 500 without leaking internals on an unexpected error", async () => {
    const res = await request(
      appWith({
        list: () =>
          Promise.reject(new Error("connection string leaked: secret")),
      }),
    ).get("/monsters");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: "INTERNAL_ERROR", message: "Internal Server Error" },
    });
  });
});
