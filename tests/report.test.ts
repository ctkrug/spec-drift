import { describe, expect, it } from "vitest";
import { buildReportHtml } from "../src/ui/report";
import type { Change } from "../src/core/types";

function change(overrides: Partial<Change>): Change {
  return { severity: "breaking", path: "/pets", method: "post", message: "example", ...overrides };
}

describe("buildReportHtml", () => {
  it("shows an explicit empty state for zero changes", () => {
    const html = buildReportHtml([]);
    expect(html).toMatch(/No differences detected/);
  });

  it("puts breaking and safe changes in visibly separate sections", () => {
    const html = buildReportHtml([
      change({ severity: "breaking", message: "field became required" }),
      change({ severity: "safe", message: "field is new and optional" }),
    ]);

    expect(html).toMatch(/Breaking changes/);
    expect(html).toMatch(/Safe changes/);
    const breakingIndex = html.indexOf("field became required");
    const safeIndex = html.indexOf("field is new and optional");
    const breakingSectionIndex = html.indexOf("report-section--breaking");
    const safeSectionIndex = html.indexOf("report-section--safe");
    expect(breakingIndex).toBeGreaterThan(breakingSectionIndex);
    expect(breakingIndex).toBeLessThan(safeSectionIndex);
    expect(safeIndex).toBeGreaterThan(safeSectionIndex);
  });

  it("groups multiple changes for the same endpoint under one card", () => {
    const html = buildReportHtml([
      change({ path: "/pets", method: "post", message: "first change" }),
      change({ path: "/pets", method: "post", message: "second change" }),
    ]);

    expect(html.match(/endpoint-card/g)).toHaveLength(1);
    expect(html).toMatch(/first change/);
    expect(html).toMatch(/second change/);
  });

  it("labels a whole-path change without a method prefix", () => {
    const html = buildReportHtml([change({ method: "*", path: "/pets", message: "removed" })]);
    expect(html).toMatch(/>\/pets</);
  });

  it("escapes HTML in change messages so injected markup can't render", () => {
    const html = buildReportHtml([change({ message: "<img src=x onerror=alert(1)>" })]);
    expect(html).not.toMatch(/<img/);
    expect(html).toMatch(/&lt;img/);
  });
});
