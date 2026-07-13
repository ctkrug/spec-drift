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
  requestBody?: unknown;
  responses?: Record<string, unknown>;
}

export interface Parameter {
  name: string;
  in: "query" | "header" | "path" | "cookie";
  required?: boolean;
  schema?: Record<string, unknown>;
}
