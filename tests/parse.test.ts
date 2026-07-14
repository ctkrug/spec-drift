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

  it("does not hang on YAML exponential alias expansion (a 'billion laughs' shape)", () => {
    // js-yaml resolves each alias to the *same* object instance rather than
    // deep-copying it, so nested anchors don't blow up memory/time the way
    // XML entity expansion does — this pins that guarantee against regression.
    const bomb = `
openapi: "3.0.0"
paths: {}
a: &a ["x","x","x","x","x","x","x","x","x"]
b: &b [*a,*a,*a,*a,*a,*a,*a,*a,*a]
c: &c [*b,*b,*b,*b,*b,*b,*b,*b,*b]
d: &d [*c,*c,*c,*c,*c,*c,*c,*c,*c]
e: &e [*d,*d,*d,*d,*d,*d,*d,*d,*d]
f: &f [*e,*e,*e,*e,*e,*e,*e,*e,*e]
g: &g [*f,*f,*f,*f,*f,*f,*f,*f,*f]
`;
    const start = Date.now();
    expect(() => parseSpec(bomb)).not.toThrow();
    expect(Date.now() - start).toBeLessThan(2000);
  });
});
