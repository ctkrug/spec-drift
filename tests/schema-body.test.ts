import { describe, expect, it } from "vitest";
import { diffRequestBodySchema, diffResponseBodySchema } from "../src/core/schema";
import type { Operation } from "../src/core/types";

function opWithRequestSchema(properties: Record<string, unknown>, required: string[] = []): Operation {
  return {
    requestBody: {
      content: { "application/json": { schema: { type: "object", properties, required } } },
    },
  };
}

function opWithResponseSchema(status: string, properties: Record<string, unknown>): Operation {
  return {
    responses: {
      [status]: {
        content: { "application/json": { schema: { type: "object", properties } } },
      },
    },
  };
}

describe("diffRequestBodySchema", () => {
  it("classifies a newly required request field as breaking", () => {
    const oldOp = opWithRequestSchema({});
    const newOp = opWithRequestSchema({ user_id: { type: "string" } }, ["user_id"]);

    const changes = diffRequestBodySchema("/users", "post", oldOp, newOp);

    expect(changes).toEqual([expect.objectContaining({ severity: "breaking" })]);
    expect(changes[0].message).toMatch(/user_id/);
  });

  it("classifies a newly optional request field as safe", () => {
    const oldOp = opWithRequestSchema({});
    const newOp = opWithRequestSchema({ note: { type: "string" } });

    expect(diffRequestBodySchema("/users", "post", oldOp, newOp)).toEqual([
      expect.objectContaining({ severity: "safe" }),
    ]);
  });

  it("classifies a removed request field as safe", () => {
    const oldOp = opWithRequestSchema({ note: { type: "string" } });
    const newOp = opWithRequestSchema({});

    expect(diffRequestBodySchema("/users", "post", oldOp, newOp)).toEqual([
      expect.objectContaining({ severity: "safe" }),
    ]);
  });

  it("returns no changes when neither operation has a request body", () => {
    expect(diffRequestBodySchema("/users", "get", {}, {})).toEqual([]);
  });
});

describe("diffResponseBodySchema", () => {
  it("classifies a removed response field as breaking", () => {
    const oldOp = opWithResponseSchema("200", { email: { type: "string" } });
    const newOp = opWithResponseSchema("200", {});

    const changes = diffResponseBodySchema("/users/{id}", "get", oldOp, newOp);

    expect(changes).toEqual([expect.objectContaining({ severity: "breaking" })]);
    expect(changes[0].message).toMatch(/email/);
  });

  it("classifies a new optional response field as safe", () => {
    const oldOp = opWithResponseSchema("200", {});
    const newOp = opWithResponseSchema("200", { nickname: { type: "string" } });

    expect(diffResponseBodySchema("/users/{id}", "get", oldOp, newOp)).toEqual([
      expect.objectContaining({ severity: "safe" }),
    ]);
  });

  it("only compares status codes present in both specs", () => {
    const oldOp = opWithResponseSchema("200", { email: { type: "string" } });
    const newOp: Operation = {
      responses: {
        ...opWithResponseSchema("200", { email: { type: "string" } }).responses,
        ...opWithResponseSchema("404", { message: { type: "string" } }).responses,
      },
    };

    expect(diffResponseBodySchema("/users/{id}", "get", oldOp, newOp)).toEqual([]);
  });
});
