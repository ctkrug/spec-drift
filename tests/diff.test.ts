import { describe, expect, it } from "vitest";
import { diffSpecs } from "../src/core/diff";
import { parseSpec } from "../src/core/parse";

describe("diffSpecs", () => {
  it("returns a Change array for two parsed specs", () => {
    const oldSpec = parseSpec('{"openapi": "3.0.0", "paths": {}}');
    const newSpec = parseSpec('{"openapi": "3.0.0", "paths": {}}');
    expect(diffSpecs(oldSpec, newSpec)).toEqual([]);
  });

  it("does not throw when a shared path is null on one side", () => {
    const oldSpec = parseSpec('{"openapi": "3.0.0", "paths": {"/x": null}}');
    const newSpec = parseSpec('{"openapi": "3.0.0", "paths": {"/x": {"get": {}}}}');
    expect(() => diffSpecs(oldSpec, newSpec)).not.toThrow();
  });
});
