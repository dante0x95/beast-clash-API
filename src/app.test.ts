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

describe("request id", () => {
  const app = createApp();

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
