# Spec Drift

[![CI](https://github.com/ctkrug/spec-drift/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkrug/spec-drift/actions/workflows/ci.yml)

Paste your old and new OpenAPI specs. Get a plain-English breaking-change report —
not a raw JSON diff.

## Why

`diff` on two OpenAPI documents tells you *that* something changed. It doesn't tell you
whether a client will break. A field moving from optional to required, a response schema
tightening, an enum value disappearing — these read as noise in a JSON diff but are exactly
the changes that snap an API contract. Spec Drift reads the diff through OpenAPI semantics
and tells you, in plain English, what actually broke: *"`user_id` became required — any
client not sending it will now get a 400."*

No install, no account, no server round-trip: paste two specs in a browser tab and read the
report.

## Features

- Paste (or upload) an old and new OpenAPI 3.x spec, JSON or YAML
- A structural diff classified against OpenAPI breaking-change semantics: parameter
  requiredness, added/removed paths and operations, enum restriction/widening, and
  request/response body schema changes (including nested properties)
- A plain-English report grouped by endpoint, breaking changes visibly separated from safe
  ones
- Inline, specific error messages for malformed or non-OpenAPI input — never a crash or a
  blank page

Planned next: a shareable link for a computed report (no backend) and Markdown export —
see [`docs/BACKLOG.md`](docs/BACKLOG.md).

## Stack

TypeScript, Vite, and Vitest. The diff engine is a pure, dependency-light TS library;
the UI is a static single-page app with no backend — the whole thing ships as a static
site and runs entirely in the browser. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
for the module map.

## Status

The core diff engine and paste-to-report UI are functionally complete. See
[`docs/VISION.md`](docs/VISION.md) for the design and [`docs/BACKLOG.md`](docs/BACKLOG.md)
for what's left.

## Development

```sh
npm install
npm run dev      # local dev server
npm test         # unit tests
npm run build    # static production build into dist/
```

## License

MIT — see [`LICENSE`](LICENSE).
