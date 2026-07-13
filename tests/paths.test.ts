import { describe, expect, it } from "vitest";
import { diffPathsAndOperations } from "../src/core/paths";
import type { OpenApiSpec } from "../src/core/types";

function spec(paths: OpenApiSpec["paths"]): OpenApiSpec {
  return { openapi: "3.0.0", paths };
}

describe("diffPathsAndOperations", () => {
  it("reports a removed path exactly once, not once per method", () => {
    const oldSpec = spec({
      "/pets": { get: {}, post: {} },
    });
    const newSpec = spec({});

    const changes = diffPathsAndOperations(oldSpec, newSpec);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ severity: "breaking", path: "/pets", method: "*" });
  });

  it("reports an added path exactly once as safe", () => {
    const oldSpec = spec({});
    const newSpec = spec({ "/pets": { get: {} } });

    const changes = diffPathsAndOperations(oldSpec, newSpec);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ severity: "safe", path: "/pets", method: "*" });
  });

  it("reports a removed operation on a path that still exists", () => {
    const oldSpec = spec({ "/pets": { get: {}, post: {} } });
    const newSpec = spec({ "/pets": { get: {} } });

    const changes = diffPathsAndOperations(oldSpec, newSpec);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ severity: "breaking", path: "/pets", method: "post" });
  });

  it("reports an added operation on a path that still exists", () => {
    const oldSpec = spec({ "/pets": { get: {} } });
    const newSpec = spec({ "/pets": { get: {}, delete: {} } });

    const changes = diffPathsAndOperations(oldSpec, newSpec);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ severity: "safe", path: "/pets", method: "delete" });
  });

  it("returns zero changes when diffed against an unmodified copy of itself", () => {
    const oldSpec = spec({ "/pets": { get: {}, post: {} }, "/pets/{id}": { get: {} } });
    const newSpec = spec({ "/pets": { get: {}, post: {} }, "/pets/{id}": { get: {} } });

    expect(diffPathsAndOperations(oldSpec, newSpec)).toEqual([]);
  });
});
