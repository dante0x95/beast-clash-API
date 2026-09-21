import { z } from "zod";

import { type BattleTurn } from "../../domain/battle/types.js";
import { paginationQuerySchema } from "../../shared/pagination.schema.js";

// ── Request schemas ──────────────────────────────────────────

export const createBattleSchema = z
  .strictObject({
    monsterAId: z.uuid(),
    monsterBId: z.uuid(),
  })
  .refine((data) => data.monsterAId !== data.monsterBId, {
    message: "A monster cannot battle itself",
    path: ["monsterBId"],
  });

export const battleIdParamSchema = z.object({
  id: z.uuid(),
});

export const listBattlesQuerySchema = paginationQuerySchema;

// ── Stored JSON schemas ──────────────────────────────────────
// These validate data read back from jsonb columns. They check structure only, never
// business limits: if MONSTER_LIMITS change later, old battles must remain readable.

export const battleSnapshotSchema = z.object({
  name: z.string(),
  imageUrl: z.string(),
  hp: z.int().min(1),
  attack: z.int().min(0),
  defense: z.int().min(0),
  speed: z.int().min(0),
});

// `satisfies` fails the build if this schema drifts from the domain's BattleTurn type
export const battleTurnSchema = z.object({
  turn: z.int().min(1),
  attackerId: z.string(),
  defenderId: z.string(),
  damage: z.int().min(1),
  defenderHpAfter: z.int().min(0),
}) satisfies z.ZodType<BattleTurn>;

export const battleTurnsSchema = z.array(battleTurnSchema).min(1);

export type CreateBattleInput = z.infer<typeof createBattleSchema>;
export type ListBattlesQuery = z.infer<typeof listBattlesQuerySchema>;
export type BattleSnapshot = z.infer<typeof battleSnapshotSchema>;
