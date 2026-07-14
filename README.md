# Spec Drift

**▶ Live demo — [apps.charliekrug.com/spec-drift](https://apps.charliekrug.com/spec-drift/)**

[![CI](https://github.com/ctkrug/spec-drift/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkrug/spec-drift/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

See what breaks before you ship. Paste your old and new OpenAPI specs and get a
plain-English breaking-change report, not a raw JSON diff.

## Why

Running `diff` on two OpenAPI documents tells you *that* something changed. It doesn't tell
you whether a client will break. A field moving from optional to required, a response schema
tightening, an enum value disappearing — these read as noise in a JSON diff but are exactly
the changes that snap an API contract. Spec Drift reads the diff through OpenAPI semantics and
tells you, in plain English, what actually broke.

No install, no account, no server round-trip: paste two specs in a browser tab and read the
report.

## What the report looks like

Feed it a spec where `assignee_id` became required and an `internal_notes` response field was
dropped, and you get:

```
2 breaking · 2 safe

Breaking changes (2)

POST /tasks
  · "assignee_id" became required in the request body of POST /tasks — any client
    not sending it will now get a 400.
  · "internal_notes" was removed from the 201 response body of POST /tasks —
    clients reading it will get undefined.

Safe changes (2)

POST /tasks
  · "created_at" is a new field in the 201 response body of POST /tasks.
  · Allowed values "urgent" were added to "priority" on POST /tasks.
```

Click **Load sample spec pair** in the app to generate exactly this.

## Features

- **Paste or upload** an old and new OpenAPI 3.x spec, JSON or YAML. 3.0 (`nullable: true`)
  and 3.1 (`type: [..., "null"]`) are treated as equivalent, so a dialect migration isn't
  flagged as a false break.
- **Semantic classification**, not a text diff: parameter requiredness, added/removed paths
  and operations, enum restriction and widening, and request/response body schema changes
  down to nested properties.
- **Breaking vs. safe, separated** — a report grouped by endpoint with breaking changes
  visibly split from safe ones, so the line that matters isn't buried.
- **Specific errors, never a blank page** — malformed or non-OpenAPI input surfaces an inline
  message on the offending panel instead of crashing.
- **Export and share** — download the report as Markdown for a PR or changelog, or copy a
  share link that reproduces it with no backend and no stored state (the specs are encoded
  into the URL itself).

## Who it's for

Backend and API developers cutting a release of a versioned HTTP API who need to answer one
question before they ship: *will this change break anyone integrated against us?* Also handy
for platform teams reviewing a partner's spec update, and for PMs or support engineers who
want the answer in English without reading a JSON diff.

## Stack

TypeScript, Vite, and Vitest. The diff engine is a pure, dependency-light TS library; the UI
is a static single-page app with no backend, so the whole thing ships as a static site and
runs entirely in the browser. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the
module map.

## Development

```sh
npm install
npm run dev       # local dev server
npm test          # unit tests (Vitest)
npm run lint      # ESLint
npm run typecheck # tsc --noEmit
npm run build     # static production build into dist/
```

## License

MIT — see [`LICENSE`](LICENSE).

---

More of Charlie's projects → [apps.charliekrug.com](https://apps.charliekrug.com)
