import { describe, expect, it } from "vitest";

import { definedOnly } from "./defined-only.js";

describe("definedOnly", () => {
  it("removes keys with undefined values", () => {
    expect(definedOnly({ a: 1, b: undefined })).toEqual({ a: 1 });
  });

  it("keeps falsy values that are not undefined", () => {
    expect(definedOnly({ a: 0, b: "", c: null, d: false })).toEqual({
      a: 0,
      b: "",
      c: null,
      d: false,
    });
  });
});
