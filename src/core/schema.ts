import type { Change, JsonSchema, Operation } from "./types";

const JSON_MEDIA_TYPE = "application/json";

export type PropertyChangeKind = "added-required" | "added-optional" | "removed";

export interface PropertyChange {
  /** Dotted path from the schema root, e.g. "address.zip". */
  name: string;
  kind: PropertyChangeKind;
}

/**
 * Recursively diffs the `properties` of two JSON Schema objects, walking
 * into nested object schemas so a change buried under a nested field (e.g.
 * a new required `address.zip`) is still reported by its full path.
 */
export function diffSchemaProperties(
  oldSchema: JsonSchema | undefined,
  newSchema: JsonSchema | undefined,
  prefix = "",
): PropertyChange[] {
  const oldProps = oldSchema?.properties ?? {};
  const newProps = newSchema?.properties ?? {};
  const newRequired = new Set(newSchema?.required ?? []);
  const changes: PropertyChange[] = [];

  for (const name of Object.keys(oldProps)) {
    const dottedName = prefix ? `${prefix}.${name}` : name;
    if (!(name in newProps)) {
      changes.push({ name: dottedName, kind: "removed" });
      continue;
    }
    changes.push(...diffSchemaProperties(oldProps[name], newProps[name], dottedName));
  }

  for (const name of Object.keys(newProps)) {
    if (name in oldProps) continue;
    const dottedName = prefix ? `${prefix}.${name}` : name;
    changes.push({
      name: dottedName,
      kind: newRequired.has(name) ? "added-required" : "added-optional",
    });
  }

  return changes;
}

/**
 * Diffs the JSON request body schema of one operation. A newly required
 * field is breaking (old clients that don't send it get a 400); an added
 * optional field or a removed field is safe (extra fields are ignored by
 * servers, and a dropped field just means clients no longer need to send it).
 */
export function diffRequestBodySchema(
  path: string,
  method: string,
  oldOp: Operation | undefined,
  newOp: Operation | undefined,
): Change[] {
  const oldSchema = oldOp?.requestBody?.content?.[JSON_MEDIA_TYPE]?.schema;
  const newSchema = newOp?.requestBody?.content?.[JSON_MEDIA_TYPE]?.schema;
  if (!oldSchema && !newSchema) return [];

  const endpoint = `${method.toUpperCase()} ${path}`;
  return diffSchemaProperties(oldSchema, newSchema).map((change) => {
    if (change.kind === "added-required") {
      return {
        severity: "breaking",
        path,
        method,
        message: `"${change.name}" became required in the request body of ${endpoint} — any client not sending it will now get a 400.`,
      };
    }
    if (change.kind === "added-optional") {
      return {
        severity: "safe",
        path,
        method,
        message: `"${change.name}" is a new optional field in the request body of ${endpoint}.`,
      };
    }
    return {
      severity: "safe",
      path,
      method,
      message: `"${change.name}" was removed from the request body schema of ${endpoint}.`,
    };
  });
}

/**
 * Diffs the JSON response body schema of one operation, per status code
 * present in both specs. A removed field is breaking (a client reading it
 * gets undefined); an added field, required or not, is safe for readers.
 */
export function diffResponseBodySchema(
  path: string,
  method: string,
  oldOp: Operation | undefined,
  newOp: Operation | undefined,
): Change[] {
  const oldResponses = oldOp?.responses ?? {};
  const newResponses = newOp?.responses ?? {};
  const endpoint = `${method.toUpperCase()} ${path}`;
  const changes: Change[] = [];

  for (const status of Object.keys(oldResponses)) {
    if (!(status in newResponses)) continue;

    const oldSchema = oldResponses[status]?.content?.[JSON_MEDIA_TYPE]?.schema;
    const newSchema = newResponses[status]?.content?.[JSON_MEDIA_TYPE]?.schema;
    if (!oldSchema && !newSchema) continue;

    for (const change of diffSchemaProperties(oldSchema, newSchema)) {
      changes.push(
        change.kind === "removed"
          ? {
              severity: "breaking",
              path,
              method,
              message: `"${change.name}" was removed from the ${status} response body of ${endpoint} — clients reading it will get undefined.`,
            }
          : {
              severity: "safe",
              path,
              method,
              message: `"${change.name}" is a new field in the ${status} response body of ${endpoint}.`,
            },
      );
    }
  }

  return changes;
}
