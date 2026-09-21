import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "./app.js";

describe("app", () => {
  const app = createApp();

  it("GET /health responde 200", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("responde 404 en rutas desconocidas", async () => {
    const res = await request(app).get("/no-existe");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not Found" });
  });

  it("no expone el header x-powered-by", async () => {
    const res = await request(app).get("/health");

    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});
