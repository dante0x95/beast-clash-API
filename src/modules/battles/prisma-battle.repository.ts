import {
  type Battle as BattleRow,
  type PrismaClient,
} from "../../generated/prisma/client.js";
import { type BattleRepository } from "./battle.repository.js";
import { battleSnapshotSchema, battleTurnsSchema } from "./battle.schemas.js";
import { type Battle, type BattleSummary } from "./battle.types.js";

const omitTurns = { turns: true } as const;

// jsonb columns come back as untyped JsonValue; parsing restores the types and fails loudly on corrupted rows
function toSummary(row: Omit<BattleRow, "turns">): BattleSummary {
  return {
    id: row.id,
    monsterA: {
      id: row.monsterAId,
      snapshot: battleSnapshotSchema.parse(row.snapshotA),
    },
    monsterB: {
      id: row.monsterBId,
      snapshot: battleSnapshotSchema.parse(row.snapshotB),
    },
    winnerId: row.winnerId,
    loserId: row.loserId,
    totalTurns: row.totalTurns,
    createdAt: row.createdAt,
  };
}

function toBattle(row: BattleRow): Battle {
  return { ...toSummary(row), turns: battleTurnsSchema.parse(row.turns) };
}

export function createPrismaBattleRepository(
  prisma: PrismaClient,
): BattleRepository {
  return {
    async create(battle) {
      const row = await prisma.battle.create({
        data: {
          monsterAId: battle.monsterA.id,
          monsterBId: battle.monsterB.id,
          snapshotA: battle.monsterA.snapshot,
          snapshotB: battle.monsterB.snapshot,
          winnerId: battle.winnerId,
          loserId: battle.loserId,
          totalTurns: battle.totalTurns,
          // spreading turns into plain objects makes them assignable to Prisma's InputJsonValue
          turns: battle.turns.map((turn) => ({ ...turn })),
        },
      });

      return toBattle(row);
    },

    async findById(id) {
      const row = await prisma.battle.findUnique({ where: { id } });

      return row ? toBattle(row) : null;
    },

    async list({ page, pageSize }) {
      const [rows, total] = await prisma.$transaction([
        prisma.battle.findMany({
          omit: omitTurns,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.battle.count(),
      ]);

      return { items: rows.map(toSummary), total, page, pageSize };
    },

    async delete(id) {
      const { count } = await prisma.battle.deleteMany({ where: { id } });

      return count > 0;
    },
  };
}
