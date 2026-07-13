import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { diffSpecs } from "../src/core/diff";
import { parseSpec } from "../src/core/parse";

function loadFixture(name: string): string {
  const path = fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
  return readFileSync(path, "utf-8");
}

describe("diffSpecs — the wow moment", () => {
  it("names the field, the endpoint, and the concrete consequence for a newly required parameter", () => {
    const oldSpec = parseSpec(loadFixture("petstore-old.yaml"));
    const newSpec = parseSpec(loadFixture("petstore-new.yaml"));

    const changes = diffSpecs(oldSpec, newSpec);
    const breaking = changes.filter((c) => c.severity === "breaking");

    expect(breaking).toHaveLength(1);
    expect(breaking[0]).toMatchObject({ path: "/pets", method: "post" });
    expect(breaking[0].message).toMatch(/X-Request-Id/);
    expect(breaking[0].message).toMatch(/became required/);
    expect(breaking[0].message).toMatch(/400/);
  });

  it("returns zero changes when a spec is diffed against an unmodified copy of itself", () => {
    const spec = parseSpec(loadFixture("petstore-old.yaml"));
    expect(diffSpecs(spec, spec)).toEqual([]);
  });
});
