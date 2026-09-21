import { type MonsterRepository } from "../modules/monsters/monster.repository.js";
import {
  type CreateMonsterInput,
  createMonsterSchema,
} from "../modules/monsters/monster.schemas.js";

const AVATAR_BASE_URL = "https://api.dicebear.com/10.x/bottts/svg";

/** Stable avatar per name: DiceBear always returns the same image for the same seed. */
export function avatarUrl(name: string): string {
  return `${AVATAR_BASE_URL}?seed=${encodeURIComponent(name)}`;
}

function monster(
  stats: Omit<CreateMonsterInput, "imageUrl">,
): CreateMonsterInput {
  return { ...stats, imageUrl: avatarUrl(stats.name) };
}

/**
 * Sample roster chosen to showcase the battle rules:
 * - Emberclaw vs Mirefang: same speed, the higher attack (Emberclaw) goes first
 * - Ironbark vs Frostmaw: same speed and attack, monster A goes first
 * - Glimmerpup vs Stonehide: attack below defense, every hit deals the minimum 1
 */
export const SEED_MONSTERS: readonly CreateMonsterInput[] = [
  monster({ name: "Emberclaw", hp: 120, attack: 45, defense: 20, speed: 60 }),
  monster({ name: "Mirefang", hp: 150, attack: 40, defense: 25, speed: 60 }),
  monster({ name: "Voltwing", hp: 90, attack: 55, defense: 10, speed: 80 }),
  monster({ name: "Stonehide", hp: 300, attack: 25, defense: 45, speed: 10 }),
  monster({ name: "Glimmerpup", hp: 60, attack: 15, defense: 15, speed: 40 }),
  monster({ name: "Ironbark", hp: 200, attack: 35, defense: 35, speed: 20 }),
  monster({ name: "Frostmaw", hp: 180, attack: 35, defense: 30, speed: 20 }),
];

export type SeedResult
  = | { status: "created"; count: number }
    | { status: "skipped"; existing: number };

/** Inserts the sample roster only into an empty table, so running it twice is harmless. */
export async function seedMonsters(
  repository: MonsterRepository,
  monsters: readonly CreateMonsterInput[] = SEED_MONSTERS,
): Promise<SeedResult> {
  const { total } = await repository.list({ page: 1, pageSize: 1 });
  if (total > 0) return { status: "skipped", existing: total };

  // same validation as POST /monsters: seeds can never create data the API would reject
  const inputs = monsters.map((input) => createMonsterSchema.parse(input));
  for (const input of inputs) {
    await repository.create(input);
  }

  return { status: "created", count: inputs.length };
}
