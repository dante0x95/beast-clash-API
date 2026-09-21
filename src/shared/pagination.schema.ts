import { z } from "zod";

export const PAGINATION_LIMITS = {
  defaultPageSize: 20,
  maxPageSize: 100,
} as const;

/** Query-string pagination: values arrive as strings, so they are coerced. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION_LIMITS.maxPageSize)
    .default(PAGINATION_LIMITS.defaultPageSize),
});
