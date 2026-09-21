import { z } from "zod";

/** Business limits for monster attributes. The DB only enforces the domain invariants (hp > 0, stats >= 0). */
export const MONSTER_LIMITS = {
  name: { min: 1, max: 50 },
  hp: { min: 1, max: 1000 },
  stat: { min: 0, max: 100 },
} as const;

const stat = z.int().min(MONSTER_LIMITS.stat.min).max(MONSTER_LIMITS.stat.max);

const monsterFields = {
  name: z
    .string()
    .trim()
    .min(MONSTER_LIMITS.name.min)
    .max(MONSTER_LIMITS.name.max),
  hp: z.int().min(MONSTER_LIMITS.hp.min).max(MONSTER_LIMITS.hp.max),
  attack: stat,
  defense: stat,
  speed: stat,
  imageUrl: z.url({ protocol: /^https?$/ }),
};

// strictObject rejects unknown keys, so typos like "hitPoints" fail loudly instead of being ignored
export const createMonsterSchema = z.strictObject(monsterFields);

export const updateMonsterSchema = z
  .strictObject(monsterFields)
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided",
  });

export const monsterIdParamSchema = z.object({
  id: z.uuid(),
});

export const listMonstersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateMonsterInput = z.infer<typeof createMonsterSchema>;
export type UpdateMonsterInput = z.infer<typeof updateMonsterSchema>;
export type ListMonstersQuery = z.infer<typeof listMonstersQuerySchema>;
