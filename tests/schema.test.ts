import { describe, expect, it } from "vitest";
import { diffSchemaProperties } from "../src/core/schema";
import type { JsonSchema } from "../src/core/types";

describe("diffSchemaProperties", () => {
  it("reports a newly added required property", () => {
    const oldSchema: JsonSchema = { type: "object", properties: {} };
    const newSchema: JsonSchema = {
      type: "object",
      properties: { user_id: { type: "string" } },
      required: ["user_id"],
    };

    expect(diffSchemaProperties(oldSchema, newSchema)).toEqual([
      { name: "user_id", kind: "added-required" },
    ]);
  });

  it("reports a newly added optional property", () => {
    const oldSchema: JsonSchema = { type: "object", properties: {} };
    const newSchema: JsonSchema = { type: "object", properties: { note: { type: "string" } } };

    expect(diffSchemaProperties(oldSchema, newSchema)).toEqual([
      { name: "note", kind: "added-optional" },
    ]);
  });

  it("reports a removed property", () => {
    const oldSchema: JsonSchema = { type: "object", properties: { email: { type: "string" } } };
    const newSchema: JsonSchema = { type: "object", properties: {} };

    expect(diffSchemaProperties(oldSchema, newSchema)).toEqual([
      { name: "email", kind: "removed" },
    ]);
  });

  it("reports changes nested under an object property with a dotted path", () => {
    const oldSchema: JsonSchema = {
      type: "object",
      properties: { address: { type: "object", properties: {} } },
    };
    const newSchema: JsonSchema = {
      type: "object",
      properties: {
        address: {
          type: "object",
          properties: { zip: { type: "string" } },
          required: ["zip"],
        },
      },
    };

    expect(diffSchemaProperties(oldSchema, newSchema)).toEqual([
      { name: "address.zip", kind: "added-required" },
    ]);
  });

  it("returns no changes for two schemas with identical properties", () => {
    const schema: JsonSchema = {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    };
    expect(diffSchemaProperties(schema, schema)).toEqual([]);
  });

  it("returns no changes when both schemas are undefined", () => {
    expect(diffSchemaProperties(undefined, undefined)).toEqual([]);
  });
});
