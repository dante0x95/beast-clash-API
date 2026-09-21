import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "./app.js";
import { makeAppDeps } from "./testing/app.fixture.js";

const healthyDeps = makeAppDeps();

describe("app", () => {
  const app = createApp(healthyDeps);

  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/unknown");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: {
        code: "ROUTE_NOT_FOUND",
        message: "Route GET /unknown not found",
      },
    });
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
      ...healthyDeps,
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

describe("CORS", () => {
  const ALLOWED = "http://localhost:5173";
  const app = createApp(
    makeAppDeps({ config: { corsOrigins: [ALLOWED], rateLimit: null } }),
  );

  it("echoes an allowed origin and exposes Location and X-Request-Id", async () => {
    const res = await request(app).get("/health").set("Origin", ALLOWED);

    expect(res.headers["access-control-allow-origin"]).toBe(ALLOWED);
    expect(res.headers["access-control-expose-headers"]).toContain(
      "Location,X-Request-Id",
    );
    expect(res.headers.vary).toMatch(/origin/i);
  });

  it("omits CORS headers for an origin that is not allowed", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "https://evil.example.com");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("answers a preflight for an allowed origin", async () => {
    const res = await request(app)
      .options("/battles")
      .set("Origin", ALLOWED)
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "content-type");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe(ALLOWED);
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
    expect(res.headers["access-control-max-age"]).toBe("600");
  });

  it("allows no origin when the list is empty", async () => {
    const res = await request(createApp(makeAppDeps()))
      .get("/health")
      .set("Origin", ALLOWED);

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("rate limit", () => {
  function appWithLimit(limit: number) {
    return createApp(
      makeAppDeps({
        config: { corsOrigins: [], rateLimit: { limit, windowMs: 60_000 } },
      }),
    );
  }

  it("returns 429 in the standard error format once the limit is exceeded", async () => {
    const app = appWithLimit(2);

    await request(app).get("/monsters").expect(200);
    await request(app).get("/monsters").expect(200);
    const res = await request(app).get("/monsters");

    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests, please try again later",
      },
    });
    expect(res.headers["retry-after"]).toBeDefined();
  });

  it("reports the remaining quota in the RateLimit headers", async () => {
    const res = await request(appWithLimit(5)).get("/monsters");

    expect(res.headers["ratelimit-policy"]).toBeDefined();
    expect(res.headers.ratelimit).toMatch(/r=4/);
  });

  it("never throttles /health", async () => {
    const app = appWithLimit(1);

    await request(app).get("/monsters").expect(200);
    await request(app).get("/monsters").expect(429);
    await request(app).get("/health").expect(200);
  });

  it("does not limit when disabled", async () => {
    const app = createApp(makeAppDeps());

    for (let i = 0; i < 5; i++) {
      await request(app).get("/monsters").expect(200);
    }
  });
});
