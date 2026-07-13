import type { Change, HttpMethod, OpenApiSpec, PathItem } from "./types";

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

function operationsIn(pathItem: PathItem): HttpMethod[] {
  return HTTP_METHODS.filter((method) => pathItem[method] !== undefined);
}

/**
 * Diffs the set of paths and, within paths present in both specs, the set
 * of operations on each. A removed/added path is reported once with
 * method "*" rather than once per HTTP method it used to carry.
 */
export function diffPathsAndOperations(oldSpec: OpenApiSpec, newSpec: OpenApiSpec): Change[] {
  const changes: Change[] = [];
  const oldPaths = oldSpec.paths ?? {};
  const newPaths = newSpec.paths ?? {};

  for (const path of Object.keys(oldPaths)) {
    if (!(path in newPaths)) {
      changes.push({
        severity: "breaking",
        path,
        method: "*",
        message: `${path} was removed — any client still calling it will now get a 404.`,
      });
    }
  }

  for (const path of Object.keys(newPaths)) {
    if (!(path in oldPaths)) {
      changes.push({
        severity: "safe",
        path,
        method: "*",
        message: `${path} is new.`,
      });
    }
  }

  for (const path of Object.keys(oldPaths)) {
    const newPathItem = newPaths[path];
    if (!newPathItem) continue;
    changes.push(...diffOperations(path, oldPaths[path], newPathItem));
  }

  return changes;
}

function diffOperations(path: string, oldPathItem: PathItem, newPathItem: PathItem): Change[] {
  const changes: Change[] = [];
  const oldMethods = operationsIn(oldPathItem);
  const newMethods = operationsIn(newPathItem);

  for (const method of oldMethods) {
    if (!newMethods.includes(method)) {
      changes.push({
        severity: "breaking",
        path,
        method,
        message: `${method.toUpperCase()} ${path} was removed — any client still calling it will now get a 404.`,
      });
    }
  }

  for (const method of newMethods) {
    if (!oldMethods.includes(method)) {
      changes.push({
        severity: "safe",
        path,
        method,
        message: `${method.toUpperCase()} ${path} is new.`,
      });
    }
  }

  return changes;
}
