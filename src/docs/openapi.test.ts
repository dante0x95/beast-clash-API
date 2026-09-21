import SwaggerParser from "@apidevtools/swagger-parser";
import { describe, expect, it } from "vitest";

import {
  toBattleDto,
  toBattleSummaryDto,
} from "../modules/battles/battle.dto.js";
import { makeBattle } from "../modules/battles/battle.fixture.js";
import { toMonsterDto } from "../modules/monsters/monster.dto.js";
import { makeMonster } from "../modules/monsters/monster.fixture.js";
import { buildOpenApiDocument } from "./openapi.js";
import {
  battleDtoSchema,
  battleSummaryDtoSchema,
  monsterDtoSchema,
} from "./response.schemas.js";

const ID_A = "01926f3e-8c2a-7b3d-9e4f-5a6b7c8d9e0a";
const ID_B = "01926f3e-8c2a-7b3d-9e4f-5a6b7c8d9e0b";

const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete"]);

function operationsOf(document: Record<string, unknown>): string[] {
  const paths = document.paths as Record<string, Record<string, unknown>>;

  return Object.entries(paths).flatMap(([path, item]) =>
    Object.keys(item)
      .filter((key) => HTTP_METHODS.has(key))
      .map((method) => `${method.toUpperCase()} ${path}`),
  );
}

describe("OpenAPI document", () => {
  it("is a valid OpenAPI 3.1 document", async () => {
    // the parser dereferences in place, so give it a copy
    await expect(
      SwaggerParser.validate(structuredClone(buildOpenApiDocument()) as never),
    ).resolves.toBeDefined();
  });

  it("documents every route of the API", () => {
    expect(operationsOf(buildOpenApiDocument()).sort()).toEqual(
      [
        "POST /monsters",
        "GET /monsters",
        "GET /monsters/{id}",
        "PATCH /monsters/{id}",
        "DELETE /monsters/{id}",
        "POST /battles",
        "GET /battles",
        "GET /battles/{id}",
        "DELETE /battles/{id}",
        "GET /health/live",
        "GET /health/ready",
      ].sort(),
    );
  });

  it("takes its version from package.json", () => {
    expect(buildOpenApiDocument()).toMatchObject({
      info: { version: expect.stringMatching(/^\d+\.\d+\.\d+/) as unknown },
    });
  });
});

// strict schemas: these fail if a DTO gains or loses a field the docs do not describe
describe("response schemas match the real DTOs", () => {
  const battle = makeBattle(ID_A, ID_B);

  it("Monster", () => {
    expect(() =>
      monsterDtoSchema.parse(toMonsterDto(makeMonster())),
    ).not.toThrow();
  });

  it("BattleSummary", () => {
    expect(() =>
      battleSummaryDtoSchema.parse(toBattleSummaryDto(battle)),
    ).not.toThrow();
  });

  it("Battle", () => {
    expect(() => battleDtoSchema.parse(toBattleDto(battle))).not.toThrow();
  });
});
