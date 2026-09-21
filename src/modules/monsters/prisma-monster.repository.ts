import { type PrismaClient } from "../../generated/prisma/client.js";
import { definedOnly } from "../../shared/utils/defined-only.js";
import { type MonsterRepository } from "./monster.repository.js";

const notDeleted = { deletedAt: null } as const;
const omitDeletedAt = { deletedAt: true } as const;

export function createPrismaMonsterRepository(
  prisma: PrismaClient,
): MonsterRepository {
  return {
    create: (input) =>
      prisma.monster.create({ data: input, omit: omitDeletedAt }),

    findById: (id) =>
      prisma.monster.findFirst({
        where: { id, ...notDeleted },
        omit: omitDeletedAt,
      }),

    async list({ page, pageSize }) {
      const where = notDeleted;
      const [items, total] = await prisma.$transaction([
        prisma.monster.findMany({
          where,
          omit: omitDeletedAt,
          // UUID v7 ids are time-ordered, so id breaks createdAt ties deterministically
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.monster.count({ where }),
      ]);

      return { items, total, page, pageSize };
    },

    async update(id, input) {
      // updateMany lets us filter by deletedAt and returns a count instead of throwing when nothing matches
      const { count } = await prisma.monster.updateMany({
        where: { id, ...notDeleted },
        data: definedOnly(input),
      });
      if (count === 0) return null;

      return prisma.monster.findFirst({ where: { id }, omit: omitDeletedAt });
    },

    async softDelete(id) {
      const { count } = await prisma.monster.updateMany({
        where: { id, ...notDeleted },
        data: { deletedAt: new Date() },
      });

      return count > 0;
    },
  };
}
