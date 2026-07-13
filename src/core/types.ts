/**
 * Minimal shape of the slice of an OpenAPI 3.x document that the diff
 * engine cares about. Deliberately loose (`Record<string, unknown>` for
 * anything not yet modeled) so parsing never rejects a spec just because
 * it uses a field this scaffold hasn't typed yet.
 */
export interface OpenApiSpec {
  openapi: string;
  info?: { title?: string; version?: string };
  paths: Record<string, PathItem>;
  components?: { schemas?: Record<string, unknown> };
}

export type HttpMethod =
  | "get"
  | "put"
  | "post"
  | "delete"
  | "options"
  | "head"
  | "patch"
  | "trace";

export type PathItem = Partial<Record<HttpMethod, Operation>>;

export interface Operation {
  operationId?: string;
  summary?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses?: Record<string, Response>;
}

export interface Parameter {
  name: string;
  in: "query" | "header" | "path" | "cookie";
  required?: boolean;
  schema?: JsonSchema;
}

export interface RequestBody {
  required?: boolean;
  content?: Record<string, MediaType>;
}

export interface Response {
  description?: string;
  content?: Record<string, MediaType>;
}

export interface MediaType {
  schema?: JsonSchema;
}

/**
 * Subset of JSON Schema (as used by OpenAPI request/response bodies) that
 * the classifier reasons about. `type` is `string | string[]` so 3.1's
 * `type: ["string", "null"]` and 3.0's `nullable: true` can both be
 * normalized without losing the original shape.
 */
export interface JsonSchema {
  type?: string | string[];
  nullable?: boolean;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  enum?: unknown[];
  items?: JsonSchema;
}

export type Severity = "breaking" | "safe";

/**
 * One classified difference between an old and new spec. `method` is `"*"`
 * for a change that applies to a whole path (e.g. the path itself was
 * removed) rather than a single operation, so path-level changes are never
 * duplicated once per HTTP method.
 */
export interface Change {
  severity: Severity;
  path: string;
  method: string;
  message: string;
}
