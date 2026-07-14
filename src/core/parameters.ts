import type { Change, Parameter } from "./types";

function paramKey(param: Parameter): string {
  return `${param.in}:${param.name}`;
}

/**
 * Normalizes an untrusted `parameters` value (the source spec was only
 * loosely validated by `parseSpec`) down to actual parameter objects,
 * dropping anything malformed — a non-array value, or a null/non-object
 * entry within one — instead of letting `.map`/property access on it throw.
 */
function sanitizeParams(params: unknown): Parameter[] {
  if (!Array.isArray(params)) return [];
  return params.filter((p): p is Parameter => typeof p === "object" && p !== null);
}

/**
 * Diffs the parameters of one operation between old and new specs.
 * Parameters are matched by (in, name) rather than position, since
 * OpenAPI parameter order carries no meaning.
 */
export function diffParameters(
  path: string,
  method: string,
  oldParams: Parameter[] = [],
  newParams: Parameter[] = [],
): Change[] {
  const changes: Change[] = [];
  const oldByKey = new Map(sanitizeParams(oldParams).map((p) => [paramKey(p), p]));
  const newByKey = new Map(sanitizeParams(newParams).map((p) => [paramKey(p), p]));
  const endpoint = `${method.toUpperCase()} ${path}`;

  for (const [key, oldParam] of oldByKey) {
    const newParam = newByKey.get(key);
    if (!newParam) {
      changes.push(
        oldParam.required
          ? {
              severity: "breaking",
              path,
              method,
              message: `Required parameter "${oldParam.name}" was removed from ${endpoint} — clients relying on it must be updated.`,
            }
          : {
              severity: "safe",
              path,
              method,
              message: `Optional parameter "${oldParam.name}" was removed from ${endpoint}.`,
            },
      );
      continue;
    }

    changes.push(...diffParameterRequiredness(endpoint, path, method, oldParam, newParam));
    changes.push(...diffParameterEnum(endpoint, path, method, oldParam, newParam));
  }

  for (const [key, newParam] of newByKey) {
    if (!oldByKey.has(key)) {
      changes.push(
        newParam.required
          ? {
              severity: "breaking",
              path,
              method,
              message: `New required parameter "${newParam.name}" was added to ${endpoint} — any client not sending it will now get a 400.`,
            }
          : {
              severity: "safe",
              path,
              method,
              message: `New optional parameter "${newParam.name}" was added to ${endpoint}.`,
            },
      );
    }
  }

  return changes;
}

function diffParameterRequiredness(
  endpoint: string,
  path: string,
  method: string,
  oldParam: Parameter,
  newParam: Parameter,
): Change[] {
  const wasRequired = oldParam.required ?? false;
  const isRequired = newParam.required ?? false;

  if (wasRequired === isRequired) return [];

  if (isRequired) {
    return [
      {
        severity: "breaking",
        path,
        method,
        message: `"${newParam.name}" became required on ${endpoint} — any client not sending it will now get a 400.`,
      },
    ];
  }

  return [
    {
      severity: "safe",
      path,
      method,
      message: `"${newParam.name}" became optional on ${endpoint}.`,
    },
  ];
}

function diffParameterEnum(
  endpoint: string,
  path: string,
  method: string,
  oldParam: Parameter,
  newParam: Parameter,
): Change[] {
  const oldEnum = oldParam.schema?.enum;
  const newEnum = newParam.schema?.enum;
  if (!oldEnum && !newEnum) return [];

  const oldValues = new Set(oldEnum ?? []);
  const newValues = new Set(newEnum ?? []);
  const removed = [...oldValues].filter((v) => !newValues.has(v));
  const added = [...newValues].filter((v) => !oldValues.has(v));

  const changes: Change[] = [];
  if (removed.length > 0) {
    changes.push({
      severity: "breaking",
      path,
      method,
      message: `Allowed values ${removed.map((v) => JSON.stringify(v)).join(", ")} were removed from "${newParam.name}" on ${endpoint} — clients sending them will now get a 400.`,
    });
  }
  if (added.length > 0) {
    changes.push({
      severity: "safe",
      path,
      method,
      message: `Allowed values ${added.map((v) => JSON.stringify(v)).join(", ")} were added to "${newParam.name}" on ${endpoint}.`,
    });
  }
  return changes;
}
