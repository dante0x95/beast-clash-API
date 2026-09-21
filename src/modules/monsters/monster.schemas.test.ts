import { describe, expect, it } from "vitest";

import {
  createMonsterSchema,
  listMonstersQuerySchema,
  MONSTER_LIMITS,
  monsterIdParamSchema,
  updateMonsterSchema,
} from "./monster.schemas.js";

const validMonster = {
  name: "Pyrodrake",
  hp: 120,
  attack: 40,
  defense: 25,
  speed: 30,
  imageUrl: "https://example.com/pyrodrake.png",
};

describe("createMonsterSchema", () => {
  it("accepts a valid monster", () => {
    expect(createMonsterSchema.parse(validMonster)).toEqual(validMonster);
  });

  it("trims the name", () => {
    const result = createMonsterSchema.parse({
      ...validMonster,
      name: "  Pyrodrake  ",
    });

    expect(result.name).toBe("Pyrodrake");
  });

  it("accepts values at the exact limits", () => {
    const atLimits = {
      ...validMonster,
      name: "x".repeat(MONSTER_LIMITS.name.max),
      hp: MONSTER_LIMITS.hp.max,
      attack: MONSTER_LIMITS.stat.min,
      speed: MONSTER_LIMITS.stat.max,
    };

    expect(createMonsterSchema.safeParse(atLimits).success).toBe(true);
  });

  it.each([
    ["name is blank", { name: "   " }],
    ["name is too long", { name: "x".repeat(MONSTER_LIMITS.name.max + 1) }],
    ["hp is zero", { hp: 0 }],
    ["hp exceeds the maximum", { hp: MONSTER_LIMITS.hp.max + 1 }],
    ["hp is not an integer", { hp: 10.5 }],
    ["attack is negative", { attack: -1 }],
    ["defense exceeds the maximum", { defense: MONSTER_LIMITS.stat.max + 1 }],
    ["speed is a numeric string", { speed: "30" }],
    ["imageUrl is not a URL", { imageUrl: "not-a-url" }],
    ["imageUrl is not http(s)", { imageUrl: "ftp://example.com/a.png" }],
    ["an unknown field is present", { hitPoints: 100 }],
  ])("rejects the monster when %s", (_, overrides) => {
    expect(
      createMonsterSchema.safeParse({ ...validMonster, ...overrides }).success,
    ).toBe(false);
  });

  it("rejects a monster with a missing field", () => {
    const { speed: _speed, ...withoutSpeed } = validMonster;

    expect(createMonsterSchema.safeParse(withoutSpeed).success).toBe(false);
  });
});

describe("updateMonsterSchema", () => {
  it("accepts a partial update", () => {
    expect(updateMonsterSchema.parse({ hp: 200 })).toEqual({ hp: 200 });
  });

  it("rejects an empty update", () => {
    expect(updateMonsterSchema.safeParse({}).success).toBe(false);
  });

  it("applies the same rules as creation to provided fields", () => {
    expect(updateMonsterSchema.safeParse({ hp: 0 }).success).toBe(false);
  });
});

describe("monsterIdParamSchema", () => {
  it("accepts a UUID", () => {
    const id = "01926f3e-8c2a-7b3d-9e4f-5a6b7c8d9e0f";

    expect(monsterIdParamSchema.parse({ id })).toEqual({ id });
  });

  it("rejects a non-UUID id", () => {
    expect(monsterIdParamSchema.safeParse({ id: "123" }).success).toBe(false);
  });
});

describe("listMonstersQuerySchema", () => {
  it("applies defaults when no query is given", () => {
    expect(listMonstersQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
    });
  });

  it("coerces query strings to numbers", () => {
    expect(
      listMonstersQuerySchema.parse({ page: "3", pageSize: "50" }),
    ).toEqual({ page: 3, pageSize: 50 });
  });

  it.each([
    ["page is zero", { page: "0" }],
    ["pageSize exceeds the maximum", { pageSize: "101" }],
    ["page is not a number", { page: "abc" }],
  ])("rejects the query when %s", (_, query) => {
    expect(listMonstersQuerySchema.safeParse(query).success).toBe(false);
  });
});
