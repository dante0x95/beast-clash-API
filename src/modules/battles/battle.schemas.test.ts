import { describe, expect, it } from "vitest";

import {
  battleIdParamSchema,
  battleSnapshotSchema,
  battleTurnsSchema,
  createBattleSchema,
} from "./battle.schemas.js";

const ID_A = "01926f3e-8c2a-7b3d-9e4f-5a6b7c8d9e0a";
const ID_B = "01926f3e-8c2a-7b3d-9e4f-5a6b7c8d9e0b";

describe("createBattleSchema", () => {
  it("accepts two different monster ids", () => {
    const input = { monsterAId: ID_A, monsterBId: ID_B };

    expect(createBattleSchema.parse(input)).toEqual(input);
  });

  it("rejects the same monster on both sides, pointing at monsterBId", () => {
    const result = createBattleSchema.safeParse({
      monsterAId: ID_A,
      monsterBId: ID_A,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path)).toEqual([
      ["monsterBId"],
    ]);
  });

  it.each([
    ["an id is not a UUID", { monsterAId: "123", monsterBId: ID_B }],
    ["an id is missing", { monsterAId: ID_A }],
    [
      "an unknown field is present",
      { monsterAId: ID_A, monsterBId: ID_B, winner: ID_A },
    ],
  ])("rejects the request when %s", (_, input) => {
    expect(createBattleSchema.safeParse(input).success).toBe(false);
  });
});

describe("battleIdParamSchema", () => {
  it("rejects a non-UUID id", () => {
    expect(battleIdParamSchema.safeParse({ id: "abc" }).success).toBe(false);
  });
});

describe("battleSnapshotSchema", () => {
  const snapshot = {
    name: "Pyrodrake",
    imageUrl: "https://example.com/p.png",
    hp: 120,
    attack: 40,
    defense: 25,
    speed: 30,
  };

  it("accepts a well-formed snapshot", () => {
    expect(battleSnapshotSchema.parse(snapshot)).toEqual(snapshot);
  });

  it("accepts stats beyond the current business limits, so old battles stay readable", () => {
    expect(
      battleSnapshotSchema.safeParse({ ...snapshot, attack: 5000 }).success,
    ).toBe(true);
  });

  it("rejects a corrupted snapshot", () => {
    expect(battleSnapshotSchema.safeParse({ name: "Pyrodrake" }).success).toBe(
      false,
    );
  });
});

describe("battleTurnsSchema", () => {
  const turn = {
    turn: 1,
    attackerId: ID_A,
    defenderId: ID_B,
    damage: 15,
    defenderHpAfter: 0,
  };

  it("accepts a non-empty list of turns", () => {
    expect(battleTurnsSchema.parse([turn])).toEqual([turn]);
  });

  it("rejects an empty list", () => {
    expect(battleTurnsSchema.safeParse([]).success).toBe(false);
  });

  it("rejects a turn with negative hp", () => {
    expect(
      battleTurnsSchema.safeParse([{ ...turn, defenderHpAfter: -1 }]).success,
    ).toBe(false);
  });
});
