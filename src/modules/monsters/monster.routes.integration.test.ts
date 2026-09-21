import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../../app.js";
import { pingDatabase } from "../../shared/db/prisma.js";
import { testPrisma } from "../../testing/integration/database.js";
import { makeMonsterInput } from "./monster.fixture.js";
import { createMonsterService } from "./monster.service.js";
import { createPrismaMonsterRepository } from "./prisma-monster.repository.js";

// Real wiring end to end: HTTP -> router -> service -> repository -> Postgres
const app = createApp({
  checkDatabase: () => pingDatabase(testPrisma),
  monsterService: createMonsterService(
    createPrismaMonsterRepository(testPrisma),
  ),
});

describe("monster routes (integration)", () => {
  it("supports the full create -> read -> update -> delete lifecycle", async () => {
    const created = await request(app)
      .post("/monsters")
      .send(makeMonsterInput())
      .expect(201);
    const { location } = created.headers;
    if (!location) throw new Error("Expected a Location header");

    // the Location header points to a readable resource
    const fetched = await request(app).get(location).expect(200);
    expect(fetched.body).toEqual(created.body);

    const updated = await request(app)
      .patch(location)
      .send({ hp: 999 })
      .expect(200);
    expect(updated.body).toMatchObject({ ...makeMonsterInput(), hp: 999 });

    await request(app)
      .get(location)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({ hp: 999 });
      });

    await request(app).delete(location).expect(204);

    await request(app).get(location).expect(404);
    await request(app).patch(location).send({ hp: 1 }).expect(404);
    await request(app).delete(location).expect(404);
  });

  it("lists monsters newest first and excludes deleted ones", async () => {
    const names = ["First", "Second", "Third"];
    const ids: string[] = [];
    for (const name of names) {
      const res = await request(app)
        .post("/monsters")
        .send(makeMonsterInput({ name }))
        .expect(201);
      ids.push((res.body as { id: string }).id);
    }
    await request(app)
      .delete(`/monsters/${ids[1] ?? ""}`)
      .expect(204);

    const res = await request(app)
      .get("/monsters?page=1&pageSize=10")
      .expect(200);

    expect(res.body).toMatchObject({
      total: 2,
      page: 1,
      pageSize: 10,
      items: [{ name: "Third" }, { name: "First" }],
    });
  });

  it("reports a healthy database", async () => {
    await request(app).get("/health").expect(200, { db: "up", status: "ok" });
  });
});
