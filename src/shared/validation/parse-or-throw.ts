import { type z } from "zod";

import { ValidationError } from "../errors/app-error.js";

/**
 * Validates untrusted input against a schema and returns the typed, parsed value.
 * Throws a ValidationError (mapped to 400) instead of leaking Zod types to the error handler.
 */
export function parseOrThrow<T extends z.ZodType>(
  schema: T,
  input: unknown,
): z.output<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(
      result.error.issues.map((issue) => ({
        path: issue.path.map(String).join("."),
        message: issue.message,
      })),
    );
  }

  return result.data;
}
