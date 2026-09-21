import request from "supertest";
import { describe, expect, it } from "vitest";

import { type AppDeps, createApp } from "./app.js";

const healthyDeps: AppDeps = { checkDatabase: () => Promise.resolve() };

describe("app", () => {
  const app = createApp(healthyDeps);

  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/no-existe");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not Found" });
  });

  it("does not expose the x-powered-by header", async () => {
    const res = await request(app).get("/health");

    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("GET /health", () => {
  it("returns 200 when the database responds", async () => {
    const res = await request(createApp(healthyDeps)).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ db: "up", status: "ok" });
  });

  it("returns 503 when the database fails", async () => {
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

  it("generates an x-request-id if it is not provided in the request", async () => {
    const res = await request(app).get("/health");

    expect(res.headers["x-request-id"]).toMatch(/^[\da-f-]{36}$/);
  });

  it("propagates the received x-request-id", async () => {
    const res = await request(app)
      .get("/health")
      .set("x-request-id", "abc-123");

    expect(res.headers["x-request-id"]).toBe("abc-123");
  });
});
