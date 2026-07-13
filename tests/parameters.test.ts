import { describe, expect, it } from "vitest";
import { diffParameters } from "../src/core/parameters";
import type { Parameter } from "../src/core/types";

function param(overrides: Partial<Parameter>): Parameter {
  return { name: "id", in: "query", ...overrides };
}

describe("diffParameters", () => {
  it("classifies optional-to-required as breaking", () => {
    const changes = diffParameters(
      "/pets",
      "post",
      [param({ required: false })],
      [param({ required: true })],
    );

    expect(changes).toEqual([
      expect.objectContaining({ severity: "breaking" }),
    ]);
    expect(changes[0].message).toMatch(/became required/);
  });

  it("classifies required-to-optional as safe", () => {
    const changes = diffParameters(
      "/pets",
      "post",
      [param({ required: true })],
      [param({ required: false })],
    );

    expect(changes).toEqual([expect.objectContaining({ severity: "safe" })]);
  });

  it("does not report a change when requiredness is unchanged", () => {
    expect(diffParameters("/pets", "get", [param({ required: true })], [param({ required: true })])).toEqual(
      [],
    );
  });

  it("classifies a new required parameter as breaking", () => {
    const changes = diffParameters("/pets", "post", [], [param({ required: true })]);
    expect(changes).toEqual([expect.objectContaining({ severity: "breaking" })]);
  });

  it("classifies a new optional parameter as safe", () => {
    const changes = diffParameters("/pets", "post", [], [param({ required: false })]);
    expect(changes).toEqual([expect.objectContaining({ severity: "safe" })]);
  });

  it("classifies removing a required parameter as breaking", () => {
    const changes = diffParameters("/pets", "post", [param({ required: true })], []);
    expect(changes).toEqual([expect.objectContaining({ severity: "breaking" })]);
  });

  it("classifies removing an optional parameter as safe", () => {
    const changes = diffParameters("/pets", "post", [param({ required: false })], []);
    expect(changes).toEqual([expect.objectContaining({ severity: "safe" })]);
  });

  it("classifies restricting an enum (removing a value) as breaking", () => {
    const changes = diffParameters(
      "/pets",
      "get",
      [param({ schema: { enum: ["a", "b"] } })],
      [param({ schema: { enum: ["a"] } })],
    );
    expect(changes).toEqual([expect.objectContaining({ severity: "breaking" })]);
  });

  it("classifies widening an enum (adding a value) as safe", () => {
    const changes = diffParameters(
      "/pets",
      "get",
      [param({ schema: { enum: ["a"] } })],
      [param({ schema: { enum: ["a", "b"] } })],
    );
    expect(changes).toEqual([expect.objectContaining({ severity: "safe" })]);
  });

  it("matches parameters by name and location, ignoring array order", () => {
    const oldParams = [param({ name: "id", in: "query" }), param({ name: "limit", in: "query" })];
    const newParams = [param({ name: "limit", in: "query" }), param({ name: "id", in: "query" })];
    expect(diffParameters("/pets", "get", oldParams, newParams)).toEqual([]);
  });
});
