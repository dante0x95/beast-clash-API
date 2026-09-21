import { type CreateMonsterInput } from "./monster.schemas.js";

/** Builds a valid monster creation payload; override only what the test cares about. */
export function makeMonsterInput(
  overrides: Partial<CreateMonsterInput> = {},
): CreateMonsterInput {
  return {
    name: "Pyrodrake",
    hp: 120,
    attack: 40,
    defense: 25,
    speed: 30,
    imageUrl: "https://example.com/pyrodrake.png",
    ...overrides,
  };
}
