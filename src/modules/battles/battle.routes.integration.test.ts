import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../../app.js";
import { pingDatabase } from "../../shared/db/prisma.js";
import { testPrisma } from "../../testing/integration/database.js";
import { makeMonsterInput } from "../monsters/monster.fixture.js";
import { type CreateMonsterInput } from "../monsters/monster.schemas.js";
import { createMonsterService } from "../monsters/monster.service.js";
import { createPrismaMonsterRepository } from "../monsters/prisma-monster.repository.js";
import { createBattleService } from "./battle.service.js";
import { createPrismaBattleRepository } from "./prisma-battle.repository.js";

// Real wiring end to end: HTTP -> router -> service -> engine + repositories -> Postgres
const monsterRepository = createPrismaMonsterRepository(testPrisma);

const app = createApp({
  battleService: createBattleService({
    battleRepository: createPrismaBattleRepository(testPrisma),
    monsterRepository,
  }),
  checkDatabase: () => pingDatabase(testPrisma),
  monsterService: createMonsterService(monsterRepository),
});

// Hawk is faster and deals 60 - 20 = 40; Tank deals 30 - 10 = 20.
// Hawk: 100 -> 80 -> 60. Tank: 100 -> 60 -> 20 -> 0. Hawk wins on turn 5.
const hawkInput = makeMonsterInput({
  name: "Hawk",
  hp: 100,
  attack: 60,
  defense: 10,
  speed: 50,
});
const tankInput = makeMonsterInput({
  name: "Tank",
  hp: 100,
  attack: 30,
  defense: 20,
  speed: 10,
});

async function createMonster(input: CreateMonsterInput): Promise<string> {
  const res = await request(app).post("/monsters").send(input).expect(201);

  return (res.body as { id: string }).id;
}

async function createBattle(
  monsterAId: string,
  monsterBId: string,
): Promise<string> {
  const res = await request(app)
    .post("/battles")
    .send({ monsterAId, monsterBId })
    .expect(201);
  const { location } = res.headers;
  if (!location) throw new Error("Expected a Location header");

  return location;
}

describe("battle routes (integration)", () => {
  it("runs a battle, persists it and reads it back through Location", async () => {
    const hawkId = await createMonster(hawkInput);
    const tankId = await createMonster(tankInput);

    // Tank is monster A, but Hawk attacks first because it is faster
    const created = await request(app)
      .post("/battles")
      .send({ monsterAId: tankId, monsterBId: hawkId })
      .expect(201);

    expect(created.body).toMatchObject({
      monsterA: { id: tankId, name: "Tank" },
      monsterB: { id: hawkId, name: "Hawk" },
      winnerId: hawkId,
      loserId: tankId,
      totalTurns: 5,
      turns: [
        {
          turn: 1,
          attackerId: hawkId,
          defenderId: tankId,
          damage: 40,
          defenderHpAfter: 60,
        },
        {
          turn: 2,
          attackerId: tankId,
          defenderId: hawkId,
          damage: 20,
          defenderHpAfter: 80,
        },
        {
          turn: 3,
          attackerId: hawkId,
          defenderId: tankId,
          damage: 40,
          defenderHpAfter: 20,
        },
        {
          turn: 4,
          attackerId: tankId,
          defenderId: hawkId,
          damage: 20,
          defenderHpAfter: 60,
        },
        {
          turn: 5,
          attackerId: hawkId,
          defenderId: tankId,
          damage: 40,
          defenderHpAfter: 0,
        },
      ],
    });

    const { location } = created.headers;
    if (!location) throw new Error("Expected a Location header");
    const fetched = await request(app).get(location).expect(200);
    expect(fetched.body).toEqual(created.body);
  });

  it("lists battles newest first without turns", async () => {
    const hawkId = await createMonster(hawkInput);
    const tankId = await createMonster(tankInput);
    const first = await createBattle(hawkId, tankId);
    const second = await createBattle(tankId, hawkId);

    const res = await request(app).get("/battles").expect(200);

    expect(res.body).toMatchObject({
      total: 2,
      page: 1,
      pageSize: 20,
      items: [
        { id: second.split("/").at(-1), totalTurns: 5 },
        { id: first.split("/").at(-1), totalTurns: 5 },
      ],
    });
    expect(res.body).not.toHaveProperty(["items", 0, "turns"]);
    expect(res.body).not.toHaveProperty(["items", 1, "turns"]);
  });

  it("keeps the battle intact after its monsters are edited or deleted", async () => {
    const hawkId = await createMonster(hawkInput);
    const tankId = await createMonster(tankInput);
    const location = await createBattle(hawkId, tankId);
    const before = await request(app).get(location).expect(200);

    await request(app)
      .patch(`/monsters/${hawkId}`)
      .send({ name: "Renamed", attack: 1 })
      .expect(200);
    await request(app).delete(`/monsters/${tankId}`).expect(204);

    const after = await request(app).get(location).expect(200);
    expect(after.body).toEqual(before.body);
    expect(after.body).toMatchObject({
      monsterA: { name: "Hawk", attack: 60 },
      monsterB: { name: "Tank" },
    });
  });

  it("returns 404 when a deleted monster is asked to battle", async () => {
    const hawkId = await createMonster(hawkInput);
    const tankId = await createMonster(tankInput);
    await request(app).delete(`/monsters/${tankId}`).expect(204);

    const res = await request(app)
      .post("/battles")
      .send({ monsterAId: hawkId, monsterBId: tankId })
      .expect(404);

    expect(res.body).toMatchObject({
      error: { code: "NOT_FOUND", message: `Monster ${tankId} not found` },
    });
    await request(app)
      .get("/battles")
      .expect(200)
      .expect((r) => {
        expect(r.body).toMatchObject({ total: 0 });
      });
  });

  it("deletes a battle without touching its monsters", async () => {
    const hawkId = await createMonster(hawkInput);
    const tankId = await createMonster(tankInput);
    const location = await createBattle(hawkId, tankId);

    await request(app).delete(location).expect(204);

    await request(app).get(location).expect(404);
    await request(app).delete(location).expect(404);
    await request(app).get(`/monsters/${hawkId}`).expect(200);
    await request(app).get(`/monsters/${tankId}`).expect(200);
  });
});
