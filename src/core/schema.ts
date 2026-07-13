import type { JsonSchema } from "./types";

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
