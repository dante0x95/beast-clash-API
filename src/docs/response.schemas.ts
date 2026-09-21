import { z } from "zod";

import {
  type BattleDto,
  type BattleParticipantDto,
  type BattleSummaryDto,
} from "../modules/battles/battle.dto.js";
import { battleTurnSchema } from "../modules/battles/battle.schemas.js";
import { type MonsterDto } from "../modules/monsters/monster.dto.js";

// Response DTOs are plain TS interfaces; these mirror them for the OpenAPI document.
// `satisfies` fails the build if a schema misses a DTO field, and the strict objects
// make the unit tests fail if a DTO gains a field the schema does not document.

const timestamp = z.iso.datetime();

export const monsterDtoSchema = z.strictObject({
  id: z.uuid(),
  name: z.string(),
  hp: z.int(),
  attack: z.int(),
  defense: z.int(),
  speed: z.int(),
  imageUrl: z.url(),
  createdAt: timestamp,
  updatedAt: timestamp,
}) satisfies z.ZodType<MonsterDto>;

const battleParticipantDtoSchema = z
  .strictObject({
    id: z.uuid(),
    name: z.string(),
    imageUrl: z.url(),
    hp: z.int(),
    attack: z.int(),
    defense: z.int(),
    speed: z.int(),
  })
  .meta({
    description: "The monster exactly as it was when the battle happened",
  }) satisfies z.ZodType<BattleParticipantDto>;

export const battleSummaryDtoSchema = z.strictObject({
  id: z.uuid(),
  monsterA: battleParticipantDtoSchema,
  monsterB: battleParticipantDtoSchema,
  winnerId: z.uuid(),
  loserId: z.uuid(),
  totalTurns: z.int().min(1),
  createdAt: timestamp,
}) satisfies z.ZodType<BattleSummaryDto>;

export const battleDtoSchema = battleSummaryDtoSchema.extend({
  turns: z.array(battleTurnSchema.strict()),
}) satisfies z.ZodType<BattleDto>;

export function pageSchema<T extends z.ZodType>(item: T): z.ZodType {
  return z.strictObject({
    items: z.array(item),
    total: z.int().min(0),
    page: z.int().min(1),
    pageSize: z.int().min(1),
  });
}

export const ERROR_CODES = [
  "VALIDATION_ERROR",
  "INVALID_JSON",
  "NOT_FOUND",
  "ROUTE_NOT_FOUND",
  "PAYLOAD_TOO_LARGE",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
] as const;

export const errorSchema = z.strictObject({
  error: z.strictObject({
    code: z.enum(ERROR_CODES),
    message: z.string(),
    issues: z
      .array(z.strictObject({ path: z.string(), message: z.string() }))
      .optional()
      .meta({ description: "Only present on VALIDATION_ERROR" }),
  }),
});

export const healthReadySchema = z.strictObject({
  db: z.enum(["up", "down"]),
  status: z.enum(["ok", "error"]),
});

export const healthLiveSchema = z.strictObject({ status: z.literal("ok") });
