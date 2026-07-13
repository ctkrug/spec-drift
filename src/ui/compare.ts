import { diffSpecs } from "../core/diff";
import { parseSpec, SpecParseError } from "../core/parse";
import type { Change } from "../core/types";
import { buildReportHtml } from "./report";

export interface CompareResult {
  oldError: string | null;
  newError: string | null;
  reportHtml: string | null;
  changes: Change[] | null;
}

/**
 * Parses both spec texts and, if both are valid, diffs and renders them.
 * Pure (no DOM access) so the paste -> report pipeline is testable without
 * a browser: each parse failure surfaces as a specific per-panel error
 * instead of aborting the whole comparison. Returns the raw `Change[]`
 * alongside the rendered HTML so callers (e.g. Markdown export) can reuse
 * the already-computed diff instead of re-parsing and re-diffing.
 */
export function compareSpecs(oldText: string, newText: string): CompareResult {
  const { spec: oldSpec, error: oldError } = tryParse(oldText);
  const { spec: newSpec, error: newError } = tryParse(newText);

  if (oldError || newError || !oldSpec || !newSpec) {
    return { oldError, newError, reportHtml: null, changes: null };
  }

  const changes = diffSpecs(oldSpec, newSpec);
  return { oldError: null, newError: null, reportHtml: buildReportHtml(changes), changes };
}

function tryParse(text: string): { spec: ReturnType<typeof parseSpec> | null; error: string | null } {
  try {
    return { spec: parseSpec(text), error: null };
  } catch (err) {
    const message = err instanceof SpecParseError ? err.message : "Failed to parse the spec.";
    return { spec: null, error: message };
  }
}
