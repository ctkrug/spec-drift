import { describe, expect, it } from "vitest";
import { compareSpecs } from "../src/ui/compare";

const VALID_OLD = '{"openapi": "3.0.0", "paths": {"/pets": {"post": {"parameters": [{"name": "id", "in": "query", "required": false}]}}}}';
const VALID_NEW = '{"openapi": "3.0.0", "paths": {"/pets": {"post": {"parameters": [{"name": "id", "in": "query", "required": true}]}}}}';

describe("compareSpecs", () => {
  it("returns report HTML when both specs are valid", () => {
    const result = compareSpecs(VALID_OLD, VALID_NEW);
    expect(result.oldError).toBeNull();
    expect(result.newError).toBeNull();
    expect(result.reportHtml).toMatch(/became required/);
  });

  it("returns the raw Change[] alongside the rendered HTML", () => {
    const result = compareSpecs(VALID_OLD, VALID_NEW);
    expect(result.changes).toEqual([expect.objectContaining({ severity: "breaking" })]);
  });

  it("returns null changes when either spec fails to parse", () => {
    const result = compareSpecs("{not valid json", VALID_NEW);
    expect(result.changes).toBeNull();
  });

  it("surfaces a specific error for a malformed old spec without touching the new one", () => {
    const result = compareSpecs("{not valid json", VALID_NEW);
    expect(result.oldError).toMatch(/Invalid JSON/);
    expect(result.newError).toBeNull();
    expect(result.reportHtml).toBeNull();
  });

  it("surfaces a specific error for a malformed new spec", () => {
    const result = compareSpecs(VALID_OLD, "{not valid json");
    expect(result.newError).toMatch(/Invalid JSON/);
    expect(result.reportHtml).toBeNull();
  });

  it("surfaces a not-an-OpenAPI-spec error for a well-formed non-OpenAPI document", () => {
    const result = compareSpecs('{"hello": "world"}', VALID_NEW);
    expect(result.oldError).toMatch(/openapi/);
    expect(result.reportHtml).toBeNull();
  });

  it("reports both panel errors when both specs are malformed", () => {
    const result = compareSpecs("", "");
    expect(result.oldError).toBeTruthy();
    expect(result.newError).toBeTruthy();
    expect(result.reportHtml).toBeNull();
  });

  it("does not crash on a YAML spec whose anchor/alias forms a circular schema", () => {
    // A pathological but valid YAML input: `&s`/`*s` make js-yaml resolve
    // "properties.a" to the schema object itself, producing a real circular
    // reference rather than deep-but-finite nesting.
    const cyclic = `
openapi: "3.0.0"
paths:
  /x:
    get:
      responses:
        "200":
          content:
            application/json:
              schema: &s
                type: object
                properties:
                  a: *s
`;

    expect(() => compareSpecs(cyclic, cyclic)).not.toThrow();
    const result = compareSpecs(cyclic, cyclic);
    expect(result.reportHtml).not.toBeNull();
  });
});
