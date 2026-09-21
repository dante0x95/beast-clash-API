import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../app.js";
import { makeAppDeps } from "../testing/app.fixture.js";
import { buildOpenApiDocument } from "./openapi.js";

describe("docs routes", () => {
  const app = createApp(makeAppDeps());

  it("serves the OpenAPI document as JSON", async () => {
    const res = await request(app).get("/docs/openapi.json");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(buildOpenApiDocument());
  });

  it("serves the Swagger UI page", async () => {
    const res = await request(app).get("/docs/");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toContain("swagger-ui");
  });

  it("is not rate limited", async () => {
    const limited = createApp(
      makeAppDeps({ config: { rateLimit: { limit: 1, windowMs: 60_000 } } }),
    );

    await request(limited).get("/docs/openapi.json").expect(200);
    await request(limited).get("/docs/openapi.json").expect(200);
  });
});
