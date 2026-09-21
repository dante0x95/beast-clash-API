import { describe, expect, it, vi } from "vitest";

import {
  makeMonster,
  makeMonsterInput,
  makeMonsterRepository,
} from "../modules/monsters/monster.fixture.js";
import { type MonsterRepository } from "../modules/monsters/monster.repository.js";
import { createMonsterSchema } from "../modules/monsters/monster.schemas.js";
import { avatarUrl, SEED_MONSTERS, seedMonsters } from "./seed-monsters.js";

function byName(name: string) {
  const found = SEED_MONSTERS.find((m) => m.name === name);
  if (!found) throw new Error(`Seed monster ${name} not found`);
  return found;
}

describe("SEED_MONSTERS", () => {
  it.each(SEED_MONSTERS.map((m) => [m.name, m] as const))(
    "%s passes the same validation as POST /monsters",
    (_name, input) => {
      expect(createMonsterSchema.safeParse(input).success).toBe(true);
    },
  );

  it("has unique names", () => {
    const names = SEED_MONSTERS.map((m) => m.name);

    expect(new Set(names).size).toBe(names.length);
  });

  // the roster documents the rules; these guard the showcase matchups against accidental edits
  it("includes a speed tie broken by attack", () => {
    const [a, b] = [byName("Emberclaw"), byName("Mirefang")];

    expect(a.speed).toBe(b.speed);
    expect(a.attack).toBeGreaterThan(b.attack);
  });

  it("includes a full tie on speed and attack", () => {
    const [a, b] = [byName("Ironbark"), byName("Frostmaw")];

    expect(a.speed).toBe(b.speed);
    expect(a.attack).toBe(b.attack);
  });

  it("includes a matchup where hits deal the minimum damage", () => {
    expect(byName("Glimmerpup").attack).toBeLessThanOrEqual(
      byName("Stonehide").defense,
    );
  });
});

describe("avatarUrl", () => {
  it("builds a stable DiceBear URL and encodes the name", () => {
    expect(avatarUrl("Fire Drake")).toBe(
      "https://api.dicebear.com/10.x/bottts/svg?seed=Fire%20Drake",
    );
  });
});

describe("seedMonsters", () => {
  it("creates every monster when the table is empty", async () => {
    const create = vi.fn<MonsterRepository["create"]>(() =>
      Promise.resolve(makeMonster()),
    );

    const result = await seedMonsters(makeMonsterRepository({ create }));

    expect(result).toEqual({ status: "created", count: SEED_MONSTERS.length });
    expect(create).toHaveBeenCalledTimes(SEED_MONSTERS.length);
    expect(create).toHaveBeenCalledWith(SEED_MONSTERS[0]);
  });

  it("skips when monsters already exist", async () => {
    const create = vi.fn<MonsterRepository["create"]>();
    const repository = makeMonsterRepository({
      create,
      list: ({ page, pageSize }) =>
        Promise.resolve({ items: [makeMonster()], total: 3, page, pageSize }),
    });

    const result = await seedMonsters(repository);

    expect(result).toEqual({ status: "skipped", existing: 3 });
    expect(create).not.toHaveBeenCalled();
  });

  it("validates every monster before inserting any", async () => {
    const create = vi.fn<MonsterRepository["create"]>();
    const invalid = [makeMonsterInput(), makeMonsterInput({ hp: 0 })];

    await expect(
      seedMonsters(makeMonsterRepository({ create }), invalid),
    ).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });
});
