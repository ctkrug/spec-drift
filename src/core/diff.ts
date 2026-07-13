import type { Change, OpenApiSpec } from "./types";

export type { Change, Severity } from "./types";

/**
 * Diffs two OpenAPI specs and classifies each change as breaking or safe.
 *
 * This is a scaffold stub — the real path/parameter/schema comparison and
 * breaking-change classification rules are the subject of the first epic
 * in docs/BACKLOG.md, not this SCOPE pass.
 */
export function diffSpecs(_oldSpec: OpenApiSpec, _newSpec: OpenApiSpec): Change[] {
  return [];
}
