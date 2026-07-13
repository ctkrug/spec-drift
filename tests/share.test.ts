import { describe, expect, it } from "vitest";
import { decodeShareFragment, encodeShareFragment, MAX_SHARE_FRAGMENT_LENGTH } from "../src/ui/share";

describe("encodeShareFragment / decodeShareFragment", () => {
  it("round-trips a spec pair through encode then decode", () => {
    const fragment = encodeShareFragment('{"openapi":"3.0.0"}', '{"openapi":"3.1.0"}');
    expect(fragment).not.toBeNull();

    const decoded = decodeShareFragment(fragment as string);
    expect(decoded).toEqual({ oldText: '{"openapi":"3.0.0"}', newText: '{"openapi":"3.1.0"}' });
  });

  it("round-trips text containing non-ASCII characters", () => {
    const oldText = "# café spec 日本語";
    const newText = "# café spec v2 日本語";

    const fragment = encodeShareFragment(oldText, newText) as string;
    expect(decodeShareFragment(fragment)).toEqual({ oldText, newText });
  });

  it("round-trips empty strings", () => {
    const fragment = encodeShareFragment("", "") as string;
    expect(decodeShareFragment(fragment)).toEqual({ oldText: "", newText: "" });
  });

  it("returns null instead of a truncated link when the spec pair is too large", () => {
    const huge = "x".repeat(MAX_SHARE_FRAGMENT_LENGTH * 2);
    expect(encodeShareFragment(huge, huge)).toBeNull();
  });

  it("returns null for an empty fragment", () => {
    expect(decodeShareFragment("")).toBeNull();
  });

  it("returns null for a corrupt/non-base64 fragment", () => {
    expect(decodeShareFragment("not-valid-base64url!!!")).toBeNull();
  });

  it("returns null for a validly-encoded but wrongly-shaped payload", () => {
    const wrongShape = btoa(JSON.stringify({ foo: "bar" }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(decodeShareFragment(wrongShape)).toBeNull();
  });
});
