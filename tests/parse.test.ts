import { describe, expect, it } from "vitest";
import { parseSpec, SpecParseError } from "../src/core/parse";

describe("parseSpec", () => {
  it("parses a minimal JSON spec", () => {
    const spec = parseSpec('{"openapi": "3.0.0", "paths": {}}');
    expect(spec.openapi).toBe("3.0.0");
    expect(spec.paths).toEqual({});
  });

  it("parses a minimal YAML spec", () => {
    const spec = parseSpec("openapi: 3.0.0\npaths: {}\n");
    expect(spec.openapi).toBe("3.0.0");
  });

  it("rejects empty input", () => {
    expect(() => parseSpec("")).toThrow(SpecParseError);
  });

  it("rejects malformed JSON with a specific error", () => {
    expect(() => parseSpec("{not valid json")).toThrow(/Invalid JSON/);
  });

  it("rejects a document missing the openapi field", () => {
    expect(() => parseSpec("paths: {}\n")).toThrow(/openapi/);
  });

  it("rejects a document missing the paths field", () => {
    expect(() => parseSpec('{"openapi": "3.0.0"}')).toThrow(/paths/);
  });
});
