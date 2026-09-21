import { describe, expect, it } from "vitest";
import { z } from "zod";

import { ValidationError } from "../errors/app-error.js";
import { parseOrThrow } from "./parse-or-throw.js";

const schema = z.object({ user: z.object({ age: z.int().min(0) }) });

function captureError(fn: () => unknown): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error("Expected function to throw");
}

describe("parseOrThrow", () => {
  it("returns the parsed value when the input is valid", () => {
    expect(parseOrThrow(schema, { user: { age: 3 } })).toEqual({
      user: { age: 3 },
    });
  });

  it("throws a ValidationError with dotted paths when the input is invalid", () => {
    const error = captureError(() =>
      parseOrThrow(schema, { user: { age: -1 } }),
    );

    expect(error).toBeInstanceOf(ValidationError);
    expect(
      (error as ValidationError).issues.map((issue) => issue.path),
    ).toEqual(["user.age"]);
  });
});
