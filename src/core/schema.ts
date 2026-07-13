import type { Change, JsonSchema, Operation } from "./types";

const JSON_MEDIA_TYPE = "application/json";

export type PropertyChangeKind =
  | "added-required"
  | "added-optional"
  | "removed"
  | "became-required"
  | "became-optional"
  | "type-narrowed"
  | "type-widened";

export interface PropertyChange {
  /** Dotted path from the schema root, e.g. "address.zip". */
  name: string;
  kind: PropertyChangeKind;
  /** Populated only for type-narrowed/type-widened: the JSON types that changed. */
  types?: string[];
}

/**
 * Normalizes a schema's allowed JSON types into a set, folding OpenAPI
 * 3.0's `nullable: true` and 3.1's `type: [..., "null"]` into the same
 * "null" member so a spec migrated between the two dialects diffs as
 * unchanged. Returns null when the schema declares no `type` at all, so an
 * untyped property never produces a spurious type change.
 */
function normalizedTypeSet(schema: JsonSchema | undefined): Set<string> | null {
  if (!schema || schema.type === undefined) return null;
  const types = new Set(Array.isArray(schema.type) ? schema.type : [schema.type]);
  if (schema.nullable) types.add("null");
  return types;
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
  const oldRequired = new Set(oldSchema?.required ?? []);
  const newRequired = new Set(newSchema?.required ?? []);
  const changes: PropertyChange[] = [];

  for (const name of Object.keys(oldProps)) {
    const dottedName = prefix ? `${prefix}.${name}` : name;
    if (!(name in newProps)) {
      changes.push({ name: dottedName, kind: "removed" });
      continue;
    }

    const wasRequired = oldRequired.has(name);
    const isRequired = newRequired.has(name);
    if (wasRequired !== isRequired) {
      changes.push({ name: dottedName, kind: isRequired ? "became-required" : "became-optional" });
    }

    const oldTypes = normalizedTypeSet(oldProps[name]);
    const newTypes = normalizedTypeSet(newProps[name]);
    if (oldTypes && newTypes) {
      const removedTypes = [...oldTypes].filter((t) => !newTypes.has(t));
      const addedTypes = [...newTypes].filter((t) => !oldTypes.has(t));
      if (removedTypes.length > 0) {
        changes.push({ name: dottedName, kind: "type-narrowed", types: removedTypes });
      }
      if (addedTypes.length > 0) {
        changes.push({ name: dottedName, kind: "type-widened", types: addedTypes });
      }
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
    switch (change.kind) {
      case "added-required":
        return {
          severity: "breaking",
          path,
          method,
          message: `"${change.name}" became required in the request body of ${endpoint} — any client not sending it will now get a 400.`,
        };
      case "added-optional":
        return {
          severity: "safe",
          path,
          method,
          message: `"${change.name}" is a new optional field in the request body of ${endpoint}.`,
        };
      case "became-required":
        return {
          severity: "breaking",
          path,
          method,
          message: `"${change.name}" became required in the request body of ${endpoint} — any client not sending it will now get a 400.`,
        };
      case "became-optional":
        return {
          severity: "safe",
          path,
          method,
          message: `"${change.name}" became optional in the request body of ${endpoint}.`,
        };
      case "removed":
        return {
          severity: "safe",
          path,
          method,
          message: `"${change.name}" was removed from the request body schema of ${endpoint}.`,
        };
      case "type-narrowed":
        return {
          severity: "breaking",
          path,
          method,
          message: `"${change.name}" no longer accepts type ${(change.types ?? []).join(", ")} in the request body of ${endpoint} — clients sending that type will now get a 400.`,
        };
      case "type-widened":
        return {
          severity: "safe",
          path,
          method,
          message: `"${change.name}" now also accepts type ${(change.types ?? []).join(", ")} in the request body of ${endpoint}.`,
        };
    }
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
      changes.push(responseFieldChange(path, method, status, endpoint, change));
    }
  }

  return changes;
}

function responseFieldChange(
  path: string,
  method: string,
  status: string,
  endpoint: string,
  change: PropertyChange,
): Change {
  switch (change.kind) {
    case "removed":
      return {
        severity: "breaking",
        path,
        method,
        message: `"${change.name}" was removed from the ${status} response body of ${endpoint} — clients reading it will get undefined.`,
      };
    case "became-optional":
      return {
        severity: "breaking",
        path,
        method,
        message: `"${change.name}" is no longer guaranteed present in the ${status} response body of ${endpoint} — clients relying on it may get undefined.`,
      };
    case "became-required":
      return {
        severity: "safe",
        path,
        method,
        message: `"${change.name}" is now always present in the ${status} response body of ${endpoint}.`,
      };
    case "added-required":
    case "added-optional":
      return {
        severity: "safe",
        path,
        method,
        message: `"${change.name}" is a new field in the ${status} response body of ${endpoint}.`,
      };
    case "type-widened":
      return {
        severity: "breaking",
        path,
        method,
        message: `"${change.name}" may now also be type ${(change.types ?? []).join(", ")} in the ${status} response body of ${endpoint} — clients expecting only the old type may break.`,
      };
    case "type-narrowed":
      return {
        severity: "safe",
        path,
        method,
        message: `"${change.name}" is now more narrowly typed in the ${status} response body of ${endpoint} (no longer type ${(change.types ?? []).join(", ")}).`,
      };
  }
}
