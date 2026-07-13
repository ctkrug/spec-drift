import { diffParameters } from "./parameters";
import { diffPathsAndOperations } from "./paths";
import { diffRequestBodySchema, diffResponseBodySchema } from "./schema";
import type { Change, HttpMethod, OpenApiSpec, PathItem } from "./types";

export type { Change, Severity } from "./types";

const HTTP_METHODS: HttpMethod[] = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
];

/**
 * Diffs two OpenAPI specs and classifies every change as breaking or safe.
 *
 * Structural changes (paths/operations added or removed) come from
 * `diffPathsAndOperations`. For every operation present in both specs,
 * parameters and request/response body schemas are diffed and classified
 * on top of that.
 */
export function diffSpecs(oldSpec: OpenApiSpec, newSpec: OpenApiSpec): Change[] {
  const changes: Change[] = [...diffPathsAndOperations(oldSpec, newSpec)];

  const oldPaths = oldSpec.paths ?? {};
  const newPaths = newSpec.paths ?? {};

  for (const path of Object.keys(oldPaths)) {
    const newPathItem = newPaths[path];
    if (!newPathItem) continue;
    changes.push(...diffSharedOperations(path, oldPaths[path], newPathItem));
  }

  return changes;
}

function diffSharedOperations(path: string, oldPathItem: PathItem, newPathItem: PathItem): Change[] {
  const changes: Change[] = [];

  for (const method of HTTP_METHODS) {
    const oldOp = oldPathItem[method];
    const newOp = newPathItem[method];
    if (!oldOp || !newOp) continue;

    changes.push(...diffParameters(path, method, oldOp.parameters, newOp.parameters));
    changes.push(...diffRequestBodySchema(path, method, oldOp, newOp));
    changes.push(...diffResponseBodySchema(path, method, oldOp, newOp));
  }

  return changes;
}
