# Backlog

14 stories across 4 epics. Every story lists concrete, verifiable acceptance criteria — a
later BUILD/QA run should be able to check each one true or false without judgment calls.

## Epic 1 — Core diff engine (the wow moment)

### [x] 1.1 Paste two specs, get a plain-English breaking-change report *(wow moment)*
- [x] Pasting an old/new OpenAPI JSON pair where a request parameter became required produces
      a report sentence naming the field, the endpoint, and the concrete consequence (e.g.
      "will now get a 400").
- [x] The report renders entirely client-side — no network request fires after initial page
      load (verified via the browser network panel while generating a report).
- [x] A change with no client impact (e.g. a new optional field) appears in a visibly separate
      "safe" section rather than being omitted or mixed in with breaking changes.

### [x] 1.2 Parse OpenAPI 3.x specs (JSON and YAML) into a normalized model
- [x] An equivalent spec written in YAML and in JSON parse to the same normalized
      representation (same paths/operations/parameters).
- [x] A document missing the required `openapi` or `paths` field throws a specific, catchable
      parse error rather than crashing or silently producing an empty spec.

### [x] 1.3 Structural diff of paths, operations, parameters, and schemas
- [x] Adding or removing a path is reported exactly once per path (not once per HTTP method
      duplicated under it).
- [x] Diffing a spec against an unmodified copy of itself returns zero changes.

### [x] 1.4 Classify parameter and path changes as breaking vs. safe
- [x] Making an optional request parameter required is classified breaking; making a required
      parameter optional is classified safe.
- [x] Removing a path or operation is classified breaking; adding a new path or operation is
      classified safe.
- [x] Restricting an enum (removing an allowed value) is classified breaking; widening an enum
      (adding an allowed value) is classified safe.

### [x] 1.5 Classify request/response body schema changes
- [x] Adding a new required property to a request body schema is classified breaking.
- [x] Removing a property from a response schema is classified breaking (a client reading it
      gets `undefined`); adding a new optional response property is classified safe.

## Epic 2 — Web UI and sharing

### [x] 2.1 Two-pane paste/upload input per docs/DESIGN.md
- [x] Both panels accept pasted text and file upload (`.json`, `.yaml`, `.yml`).
- [x] Every control (panel, upload button, Compare button) has themed hover, focus-visible,
      active, and disabled states — no unstyled native widgets.

### [x] 2.2 Report view grouped by endpoint, breaking/safe distinction, design polish
- [x] Breaking changes render in `--danger` and safe changes in `--success` per
      docs/DESIGN.md's token table.
- [x] Endpoints with zero detected changes are collapsed out of the report by default rather
      than shown as empty noise.
- [x] Page matches docs/DESIGN.md's layout intent and signature drafting-line sweep at
      390×844, 768×1024, and 1440×900.

### [ ] 2.3 Shareable link for a computed report, no backend
- [ ] Opening a generated share URL in a fresh browser tab (no prior localStorage/session
      state) reproduces the identical report.
- [ ] A spec pair large enough to exceed a reasonable URL length shows a clear inline message
      instead of silently producing a broken/truncated link.

### [x] 2.4 Inline error handling for invalid input
- [x] Pasting malformed JSON or YAML shows a specific inline error message, not a crash or
      blank page.
- [x] Pasting a well-formed JSON/YAML document that isn't an OpenAPI spec (no `openapi` field)
      shows a specific "not an OpenAPI spec" message rather than a generic parse failure.

## Epic 3 — Robustness and classifier depth

### [x] 3.1 Full classifier rule-set unit test coverage
- [x] Every breaking/safe rule listed in docs/VISION.md's "v1 done" section has at least one
      passing test and one test that would fail if the rule regressed.
- [x] `npm test` exits zero with all classifier tests green.

### [x] 3.2 Support OpenAPI 3.0 and 3.1 spec variants
- [x] A 3.0-syntax spec (`nullable: true`) and its 3.1-syntax equivalent (`type: ["string",
      "null"]`) both parse without error.
- [x] Diffing a 3.0-authored spec against a semantically identical 3.1-authored spec reports
      zero breaking changes.

### [ ] 3.3 Markdown export of the report
- [ ] Clicking "Export" downloads a `.md` file whose section headings and change list match
      the on-screen report.

## Epic 4 — Ship polish

### [x] 4.1 Sample spec quick-load pairs for first-time users
- [x] The page ships at least one built-in before/after spec pair loadable with a single click,
      producing a non-empty report with no spec of the visitor's own required.

### [x] 4.2 Landing and subpath-deploy polish
- [x] The production build (`npm run build`) uses only relative asset paths and renders
      correctly when the `dist/` output is served from a non-root subpath.
- [x] The page has a custom favicon (no default globe) and a meta description suitable for a
      shared link preview.
