import { describe, expect, it } from "vitest";
import { diffSpecs } from "../src/core/diff";
import { parseSpec } from "../src/core/parse";

const OPENAPI_30_SPEC = `
openapi: 3.0.0
paths:
  /users/{id}:
    get:
      responses:
        "200":
          content:
            application/json:
              schema:
                type: object
                properties:
                  nickname:
                    type: string
                    nullable: true
`;

const OPENAPI_31_SPEC = `
openapi: 3.1.0
paths:
  /users/{id}:
    get:
      responses:
        "200":
          content:
            application/json:
              schema:
                type: object
                properties:
                  nickname:
                    type: ["string", "null"]
`;

describe("OpenAPI 3.0 / 3.1 spec variants", () => {
  it("parses both dialects without error", () => {
    expect(() => parseSpec(OPENAPI_30_SPEC)).not.toThrow();
    expect(() => parseSpec(OPENAPI_31_SPEC)).not.toThrow();
  });

  it("reports zero breaking changes between semantically identical 3.0 and 3.1 specs", () => {
    const oldSpec = parseSpec(OPENAPI_30_SPEC);
    const newSpec = parseSpec(OPENAPI_31_SPEC);

    const changes = diffSpecs(oldSpec, newSpec);

    expect(changes.filter((c) => c.severity === "breaking")).toEqual([]);
  });
});
