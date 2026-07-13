import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseSpec } from "../src/core/parse";

function loadFixture(name: string): string {
  const path = fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
  return readFileSync(path, "utf-8");
}

describe("petstore fixtures", () => {
  it("both parse to a normalized spec with the same paths", () => {
    const oldSpec = parseSpec(loadFixture("petstore-old.yaml"));
    const newSpec = parseSpec(loadFixture("petstore-new.yaml"));

    expect(Object.keys(oldSpec.paths)).toEqual(Object.keys(newSpec.paths));
    expect(oldSpec.paths["/pets"]?.post?.parameters?.[0]).toMatchObject({
      name: "X-Request-Id",
      required: false,
    });
    expect(newSpec.paths["/pets"]?.post?.parameters?.[0]).toMatchObject({
      name: "X-Request-Id",
      required: true,
    });
  });
});
