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
runs the drafting-line sweep animation before revealing the report. It also wires two
export paths off the same computed `Change[]`: `buildReportMarkdown` (Export .md button,
downloaded via a Blob/object-URL anchor) and `encodeShareFragment`/`decodeShareFragment`
(Copy share link button, and decoding `location.hash` back into a report on page load) —
see "Sharing a report" below.

## Modules

- **`src/core/types.ts`** — the normalized OpenAPI model (`OpenApiSpec`, `PathItem`,
  `Operation`, `Parameter`, `RequestBody`/`Response`/`MediaType`, `JsonSchema`) plus the
  shared `Change`/`Severity` output type every classifier returns.
- **`src/core/parse.ts`** — turns pasted JSON or YAML text into an `OpenApiSpec`, or throws
  `SpecParseError` with a specific message (empty input, invalid JSON/YAML, missing
  `openapi` field, or a document that parses to a non-object shape).
- **`src/core/paths.ts`** — structural diff of the path/operation set. A path add/remove
  is one `Change` (`method: "*"`), not one per HTTP method. Exports `normalizePathItem`,
  shared with `diff.ts`, which coerces a `null`/non-object path item (e.g. a YAML key with
  nothing indented underneath it) to `{}` instead of throwing on property access.
- **`src/core/parameters.ts`** — diffs one operation's parameters, matched by `(in, name)`.
  Classifies requiredness toggles, add/remove, and enum restriction/widening. Sanitizes an
  untrusted `parameters` value first (non-array → empty, null/non-object entries dropped),
  since `parseSpec` only validates the spec's top-level shape.
- **`src/core/schema.ts`** — `diffSchemaProperties` recursively walks JSON Schema
  `properties`, producing dotted paths (e.g. `address.zip`) for nested changes: added/removed
  properties, requiredness toggles on properties present in both schemas
  (`became-required`/`became-optional`), and type narrowing/widening via a normalized type
  set that folds OpenAPI 3.0's `nullable: true` and 3.1's `type: [..., "null"]` into the same
  representation. `diffRequestBodySchema`/`diffResponseBodySchema` classify those property
  diffs directionally: for a request body (input), narrowing is breaking and widening is
  safe; for a response body (output), it's the reverse — widening is breaking (a client may
  see a type/absence it never handled) and narrowing is safe. Recursion is capped at 64
  levels so a YAML anchor/alias that makes a schema reference itself (a genuine circular
  object, not just deep nesting) can't blow the call stack.
- **`src/core/diff.ts`** — composes the above into `diffSpecs`, the single entry point
  the UI calls.
- **`src/ui/compare.ts`** — `compareSpecs(oldText, newText)`: the paste-text-to-report-HTML
  pipeline, DOM-free. Returns the raw `Change[]` alongside the rendered HTML so callers can
  reuse the computed diff (e.g. for Markdown export) without re-parsing/re-diffing.
- **`src/ui/report.ts`** — `buildReportHtml(changes)`: pure HTML-string builder (escapes
  all interpolated text) grouped into breaking/safe sections, each grouped by endpoint.
  `buildReportMarkdown(changes)` mirrors the same section/endpoint/change-list structure as
  Markdown headings and bullets, for the Export .md button.
- **`src/ui/share.ts`** — `encodeShareFragment`/`decodeShareFragment`: pure, DOM-free
  base64url encode/decode of both spec texts into a URL hash fragment, so a report can be
  reproduced on a fresh load by re-running the same client-side pipeline (no backend, no
  stored state). Encoding returns `null` past `MAX_SHARE_FRAGMENT_LENGTH` instead of
  producing a link a browser/proxy would silently truncate.
- **`src/ui/app.ts`** — mounts the app shell, wires Compare/upload/sweep-animation/Export/
  Share DOM events, and decodes `location.hash` on mount to auto-reproduce a shared report.
  The only module touching `document`/`window`.
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
end-to-end diff tests are in `tests/fixtures/`. `tests/app.test.ts` covers the DOM-touching
`app.ts` module in a jsdom environment (scoped via a `// @vitest-environment jsdom` docblock
so the rest of the suite stays in the faster default node environment). `npx vitest run
--coverage` (via `@vitest/coverage-v8`) reports line/branch/function coverage.
