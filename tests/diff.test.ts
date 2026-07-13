import { describe, expect, it } from "vitest";
import { diffSpecs } from "../src/core/diff";
import { parseSpec } from "../src/core/parse";

describe("diffSpecs", () => {
  it("returns a Change array for two parsed specs", () => {
    const oldSpec = parseSpec('{"openapi": "3.0.0", "paths": {}}');
    const newSpec = parseSpec('{"openapi": "3.0.0", "paths": {}}');
    expect(diffSpecs(oldSpec, newSpec)).toEqual([]);
  });
});
