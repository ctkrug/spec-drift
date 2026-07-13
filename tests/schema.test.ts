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

  it("reports an existing property becoming required", () => {
    const oldSchema: JsonSchema = { type: "object", properties: { note: { type: "string" } } };
    const newSchema: JsonSchema = {
      type: "object",
      properties: { note: { type: "string" } },
      required: ["note"],
    };

    expect(diffSchemaProperties(oldSchema, newSchema)).toEqual([
      { name: "note", kind: "became-required" },
    ]);
  });

  it("reports an existing property becoming optional", () => {
    const oldSchema: JsonSchema = {
      type: "object",
      properties: { note: { type: "string" } },
      required: ["note"],
    };
    const newSchema: JsonSchema = { type: "object", properties: { note: { type: "string" } } };

    expect(diffSchemaProperties(oldSchema, newSchema)).toEqual([
      { name: "note", kind: "became-optional" },
    ]);
  });

  it("reports a property type narrowing", () => {
    const oldSchema: JsonSchema = { type: "object", properties: { count: { type: ["number", "string"] } } };
    const newSchema: JsonSchema = { type: "object", properties: { count: { type: "number" } } };

    expect(diffSchemaProperties(oldSchema, newSchema)).toEqual([
      { name: "count", kind: "type-narrowed", types: ["string"] },
    ]);
  });

  it("reports a property type widening", () => {
    const oldSchema: JsonSchema = { type: "object", properties: { count: { type: "number" } } };
    const newSchema: JsonSchema = { type: "object", properties: { count: { type: ["number", "string"] } } };

    expect(diffSchemaProperties(oldSchema, newSchema)).toEqual([
      { name: "count", kind: "type-widened", types: ["string"] },
    ]);
  });

  it("treats 3.0 nullable and 3.1 type-array null as equivalent", () => {
    const openApi30Schema: JsonSchema = {
      type: "object",
      properties: { note: { type: "string", nullable: true } },
    };
    const openApi31Schema: JsonSchema = {
      type: "object",
      properties: { note: { type: ["string", "null"] } },
    };

    expect(diffSchemaProperties(openApi30Schema, openApi31Schema)).toEqual([]);
    expect(diffSchemaProperties(openApi31Schema, openApi30Schema)).toEqual([]);
  });

  it("does not report a type change when a property omits type entirely", () => {
    const oldSchema: JsonSchema = { type: "object", properties: { data: {} } };
    const newSchema: JsonSchema = { type: "object", properties: { data: { type: "string" } } };

    expect(diffSchemaProperties(oldSchema, newSchema)).toEqual([]);
  });
});
