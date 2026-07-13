# Architecture

A static, client-side-only TypeScript app: paste two OpenAPI specs, get a classified
plain-English diff. No backend, no build-time server calls — `npm run build` produces a
self-contained `dist/` deployable to any static host or subpath.

## Data flow

```
textarea (old) ──┐
                  ├─> compareSpecs(oldText, newText)   [src/ui/compare.ts]
textarea (new) ──┘         │
                            ├─ parseSpec() per side     [src/core/parse.ts]
                            │     └─ throws SpecParseError on empty/malformed/non-OpenAPI input
                            │
                            └─ diffSpecs(oldSpec, newSpec)  [src/core/diff.ts]
                                  ├─ diffPathsAndOperations()   [src/core/paths.ts]
                                  ├─ per shared operation:
                                  │    ├─ diffParameters()           [src/core/parameters.ts]
                                  │    ├─ diffRequestBodySchema()     [src/core/schema.ts]
                                  │    └─ diffResponseBodySchema()    [src/core/schema.ts]
                                  └─> Change[] (severity: "breaking" | "safe")
                                        │
                                        └─> buildReportHtml(changes)   [src/ui/report.ts]
                                              └─> grouped by endpoint, breaking/safe sections
```

`compareSpecs` is pure (no DOM access) so the whole paste-to-report pipeline is unit
testable without a browser. `src/ui/app.ts` is the only module that touches the DOM: it
mounts the shell, wires the Compare button and file-upload inputs to `compareSpecs`, and
runs the drafting-line sweep animation before revealing the report.

## Modules

- **`src/core/types.ts`** — the normalized OpenAPI model (`OpenApiSpec`, `PathItem`,
  `Operation`, `Parameter`, `RequestBody`/`Response`/`MediaType`, `JsonSchema`) plus the
  shared `Change`/`Severity` output type every classifier returns.
- **`src/core/parse.ts`** — turns pasted JSON or YAML text into an `OpenApiSpec`, or throws
  `SpecParseError` with a specific message (empty input, invalid JSON/YAML, missing
  `openapi` field).
- **`src/core/paths.ts`** — structural diff of the path/operation set. A path add/remove
  is one `Change` (`method: "*"`), not one per HTTP method.
- **`src/core/parameters.ts`** — diffs one operation's parameters, matched by `(in, name)`.
  Classifies requiredness toggles, add/remove, and enum restriction/widening.
- **`src/core/schema.ts`** — `diffSchemaProperties` recursively walks JSON Schema
  `properties`, producing dotted paths (e.g. `address.zip`) for nested changes.
  `diffRequestBodySchema`/`diffResponseBodySchema` classify those property diffs
  (request: new required field is breaking; response: removed field is breaking).
- **`src/core/diff.ts`** — composes the above into `diffSpecs`, the single entry point
  the UI calls.
- **`src/ui/compare.ts`** — `compareSpecs(oldText, newText)`: the paste-text-to-report-HTML
  pipeline, DOM-free.
- **`src/ui/report.ts`** — `buildReportHtml(changes)`: pure HTML-string builder (escapes
  all interpolated text) grouped into breaking/safe sections, each grouped by endpoint.
- **`src/ui/app.ts`** — mounts the app shell, wires Compare/upload/sweep-animation DOM
  events. The only module touching `document`/`window`.
- **`src/style.css`** — design tokens and layout per `docs/DESIGN.md` (blueprint direction).

## Running it

```sh
npm install
npm run dev        # local dev server
npm test           # vitest — pure logic, no browser needed
npm run typecheck
npm run lint
npm run build       # static production build into dist/, base path "./"
```

Tests live in `tests/`, mirroring the `src/core` and `src/ui` module split. Fixtures for
end-to-end diff tests are in `tests/fixtures/`.
