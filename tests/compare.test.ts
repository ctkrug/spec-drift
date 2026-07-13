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
});
