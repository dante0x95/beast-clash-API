import request from "supertest";
import { describe, expect, it } from "vitest";

import { type AppDeps, createApp } from "./app.js";

const healthyDeps: AppDeps = { checkDatabase: () => Promise.resolve() };

describe("app", () => {
  const app = createApp(healthyDeps);

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

describe("GET /health", () => {
  it("responde 200 cuando la base de datos responde", async () => {
    const res = await request(createApp(healthyDeps)).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ db: "up", status: "ok" });
  });

  it("responde 503 cuando la base de datos falla", async () => {
    const app = createApp({
      checkDatabase: () => Promise.reject(new Error("connection refused")),
    });

    const res = await request(app).get("/health");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ db: "down", status: "error" });
  });
});

describe("request id", () => {
  const app = createApp(healthyDeps);

  it("genera un x-request-id si no viene en la petición", async () => {
    const res = await request(app).get("/health");

    expect(res.headers["x-request-id"]).toMatch(/^[\da-f-]{36}$/);
  });

  it("propaga el x-request-id recibido", async () => {
    const res = await request(app)
      .get("/health")
      .set("x-request-id", "abc-123");

    expect(res.headers["x-request-id"]).toBe("abc-123");
  });
});
