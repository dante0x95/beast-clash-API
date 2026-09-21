export type DefinedOnly<T> = { [K in keyof T]?: Exclude<T[K], undefined> };

/**
 * Drops keys whose value is `undefined`.
 * Needed with `exactOptionalPropertyTypes`: Zod's `.partial()` yields `{ a?: T | undefined }`,
 * but Prisma inputs only accept `{ a?: T }`.
 */
export function definedOnly<T extends object>(input: T): DefinedOnly<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as DefinedOnly<T>;
}
