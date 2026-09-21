import { readFileSync } from "node:fs";

import { z } from "zod";

import { createBattleSchema } from "../modules/battles/battle.schemas.js";
import {
  createMonsterSchema,
  updateMonsterSchema,
} from "../modules/monsters/monster.schemas.js";
import { PAGINATION_LIMITS } from "../shared/pagination.schema.js";
import {
  battleDtoSchema,
  battleSummaryDtoSchema,
  errorSchema,
  healthLiveSchema,
  healthReadySchema,
  monsterDtoSchema,
  pageSchema,
} from "./response.schemas.js";

// openapi-types' 3.1 typings break under exactOptionalPropertyTypes, so the document is
// typed loosely here and validated against the OpenAPI 3.1 spec in the unit tests instead
export type OpenApiDocument = Record<string, unknown>;
type JsonObject = Record<string, unknown>;

/** Request/response JSON Schema generated from the same Zod schemas the API validates with. */
function toSchema(schema: z.ZodType, io: "input" | "output"): JsonObject {
  const { $schema: _dialect, ...json } = z.toJSONSchema(schema, { io });
  return json;
}

// src/docs and dist/docs are both two levels below package.json
function readApiVersion(): string {
  const pkg: unknown = JSON.parse(
    readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
  );
  return z.object({ version: z.string() }).parse(pkg).version;
}

const ref = (name: string): JsonObject => ({
  $ref: `#/components/schemas/${name}`,
});

const json = (schema: JsonObject): JsonObject => ({
  "application/json": { schema },
});

const error = (description: string): JsonObject => ({
  description,
  content: json(ref("Error")),
});

const idParameter = (resource: string): JsonObject => ({
  name: "id",
  in: "path",
  required: true,
  description: `${resource} id (UUID)`,
  schema: { type: "string", format: "uuid" },
});

const paginationParameters: JsonObject[] = [
  {
    name: "page",
    in: "query",
    schema: { type: "integer", minimum: 1, default: 1 },
  },
  {
    name: "pageSize",
    in: "query",
    schema: {
      type: "integer",
      minimum: 1,
      maximum: PAGINATION_LIMITS.maxPageSize,
      default: PAGINATION_LIMITS.defaultPageSize,
    },
  },
];

const createdHeaders = {
  Location: {
    description: "URL of the created resource",
    schema: { type: "string" },
  },
};

// every route behind the rate limiter can answer these
const commonErrors = {
  429: error("Rate limit exceeded (see the RateLimit and Retry-After headers)"),
  500: error("Unexpected error; the cause is logged, never returned"),
};

const DESCRIPTION = `Create monsters and simulate turn-based battles between them.

**Battle rules**
- The faster monster attacks first; on a speed tie, the higher attack goes first; on a full tie, \`monsterA\` goes first.
- Damage = attacker's attack − defender's defense, with a minimum of 1.
- Monsters alternate turns until one reaches 0 hp. Each turn reports the full \`damage\` dealt, while \`defenderHpAfter\` never drops below 0.

Battles store a snapshot of both monsters, so the history stays intact when a monster is later edited or deleted.`;

export function buildOpenApiDocument(): OpenApiDocument {
  return {
    openapi: "3.1.0",
    info: {
      title: "Beast Clash API",
      version: readApiVersion(),
      description: DESCRIPTION,
    },
    // relative, so the same document works locally and once deployed
    servers: [{ url: "/" }],
    tags: [{ name: "Monsters" }, { name: "Battles" }, { name: "Health" }],
    paths: {
      "/monsters": {
        post: {
          tags: ["Monsters"],
          summary: "Create a monster",
          requestBody: {
            required: true,
            content: json(ref("CreateMonsterRequest")),
          },
          responses: {
            201: {
              description: "Monster created",
              headers: createdHeaders,
              content: json(ref("Monster")),
            },
            400: error("Invalid body or malformed JSON"),
            413: error("Body larger than 10kb"),
            ...commonErrors,
          },
        },
        get: {
          tags: ["Monsters"],
          summary: "List monsters, newest first",
          parameters: paginationParameters,
          responses: {
            200: {
              description: "A page of monsters",
              content: json(ref("MonsterPage")),
            },
            400: error("Invalid pagination"),
            ...commonErrors,
          },
        },
      },
      "/monsters/{id}": {
        parameters: [idParameter("Monster")],
        get: {
          tags: ["Monsters"],
          summary: "Get a monster",
          responses: {
            200: { description: "The monster", content: json(ref("Monster")) },
            400: error("Invalid id"),
            404: error("Monster not found"),
            ...commonErrors,
          },
        },
        patch: {
          tags: ["Monsters"],
          summary: "Update some fields of a monster",
          requestBody: {
            required: true,
            content: json(ref("UpdateMonsterRequest")),
          },
          responses: {
            200: {
              description: "The updated monster",
              content: json(ref("Monster")),
            },
            400: error("Invalid id or body"),
            404: error("Monster not found"),
            413: error("Body larger than 10kb"),
            ...commonErrors,
          },
        },
        delete: {
          tags: ["Monsters"],
          summary: "Delete a monster (soft delete; its battles are kept)",
          responses: {
            204: { description: "Monster deleted" },
            400: error("Invalid id"),
            404: error("Monster not found"),
            ...commonErrors,
          },
        },
      },
      "/battles": {
        post: {
          tags: ["Battles"],
          summary:
            "Simulate a battle between two monsters and store the result",
          requestBody: {
            required: true,
            content: json(ref("CreateBattleRequest")),
          },
          responses: {
            201: {
              description: "Battle simulated and stored, with every turn",
              headers: createdHeaders,
              content: json(ref("Battle")),
            },
            400: error("Invalid body, or both ids are the same monster"),
            404: error("One of the monsters does not exist"),
            413: error("Body larger than 10kb"),
            ...commonErrors,
          },
        },
        get: {
          tags: ["Battles"],
          summary: "List past battles, newest first (without turns)",
          parameters: paginationParameters,
          responses: {
            200: {
              description: "A page of battle summaries",
              content: json(ref("BattleSummaryPage")),
            },
            400: error("Invalid pagination"),
            ...commonErrors,
          },
        },
      },
      "/battles/{id}": {
        parameters: [idParameter("Battle")],
        get: {
          tags: ["Battles"],
          summary: "Get a battle with every turn",
          responses: {
            200: { description: "The battle", content: json(ref("Battle")) },
            400: error("Invalid id"),
            404: error("Battle not found"),
            ...commonErrors,
          },
        },
        delete: {
          tags: ["Battles"],
          summary: "Delete a battle (its monsters are not affected)",
          responses: {
            204: { description: "Battle deleted" },
            400: error("Invalid id"),
            404: error("Battle not found"),
            ...commonErrors,
          },
        },
      },
      "/health/live": {
        get: {
          tags: ["Health"],
          summary: "Liveness: the process is up (never checks the database)",
          responses: {
            200: { description: "Alive", content: json(ref("HealthLive")) },
          },
        },
      },
      "/health/ready": {
        get: {
          tags: ["Health"],
          summary: "Readiness: the database answers (also served at /health)",
          responses: {
            200: { description: "Ready", content: json(ref("HealthReady")) },
            503: {
              description: "Database is down",
              content: json(ref("HealthReady")),
            },
          },
        },
      },
    },
    components: {
      schemas: {
        CreateMonsterRequest: toSchema(createMonsterSchema, "input"),
        // the "at least one field" refinement cannot be expressed by Zod's converter
        UpdateMonsterRequest: {
          ...toSchema(updateMonsterSchema, "input"),
          minProperties: 1,
        },
        CreateBattleRequest: {
          ...toSchema(createBattleSchema, "input"),
          description:
            "monsterAId and monsterBId must be different. On a full tie, monster A attacks first.",
        },
        Monster: toSchema(monsterDtoSchema, "output"),
        MonsterPage: toSchema(pageSchema(monsterDtoSchema), "output"),
        BattleSummary: toSchema(battleSummaryDtoSchema, "output"),
        BattleSummaryPage: toSchema(
          pageSchema(battleSummaryDtoSchema),
          "output",
        ),
        Battle: toSchema(battleDtoSchema, "output"),
        Error: toSchema(errorSchema, "output"),
        HealthLive: toSchema(healthLiveSchema, "output"),
        HealthReady: toSchema(healthReadySchema, "output"),
      },
    },
  };
}
