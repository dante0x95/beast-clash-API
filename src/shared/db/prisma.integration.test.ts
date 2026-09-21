import { describe, expect, it } from "vitest";

import { testPrisma } from "../../testing/integration/database.js";
import { pingDatabase } from "./prisma.js";

describe("database (integration)", () => {
  it("connects to the test database", async () => {
    await expect(pingDatabase(testPrisma)).resolves.toBeUndefined();
  });

  it("rejects a monster with non-positive hp via check constraint", async () => {
    const invalid = {
      name: "Ghost",
      hp: 0,
      attack: 1,
      defense: 1,
      speed: 1,
      imageUrl: "https://example.com/ghost.png",
    };

    await expect(testPrisma.monster.create({ data: invalid })).rejects.toThrow(
      /check constraint/i,
    );
  });
});
