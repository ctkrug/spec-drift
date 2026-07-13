import { load as loadYaml } from "js-yaml";
import type { OpenApiSpec } from "./types";

export class SpecParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpecParseError";
  }
}

/**
 * Parses a pasted OpenAPI document, accepting either JSON or YAML text.
 * JSON is tried first since it's a strict subset of what js-yaml accepts —
 * that keeps JSON parse errors specific instead of surfacing as YAML errors.
 */
export function parseSpec(text: string): OpenApiSpec {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new SpecParseError("Spec is empty.");
  }

  const doc = trimmed.startsWith("{") ? parseAsJson(trimmed) : parseAsYaml(trimmed);

  if (typeof doc !== "object" || doc === null) {
    throw new SpecParseError("Spec must be a JSON or YAML object.");
  }
  if (!("openapi" in doc)) {
    throw new SpecParseError('Spec is missing the required "openapi" field.');
  }
  if (!("paths" in doc)) {
    throw new SpecParseError('Spec is missing the required "paths" field.');
  }

  const spec = doc as Partial<OpenApiSpec>;
  return {
    openapi: String(spec.openapi),
    info: spec.info,
    paths: spec.paths ?? {},
    components: spec.components,
  };
}

function parseAsJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new SpecParseError(`Invalid JSON: ${(err as Error).message}`);
  }
}

function parseAsYaml(text: string): unknown {
  try {
    return loadYaml(text);
  } catch (err) {
    throw new SpecParseError(`Invalid YAML: ${(err as Error).message}`);
  }
}
