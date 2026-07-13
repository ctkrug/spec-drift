# Vision

## The problem

Two OpenAPI specs go into a diff tool and a wall of JSON `+`/`-` lines comes out. Somewhere
in that wall is the one line that matters — a field that quietly became required, a response
schema that got stricter, a query parameter that vanished — but it reads exactly like every
cosmetic change around it (a reordered property, a reworded description, a bumped `version`
string). The person who needs the answer — "will this release break someone's integration?" —
is rarely the person equipped to read a JSON diff and mentally re-derive OpenAPI semantics for
every line. So the diff gets skimmed, the risky change gets missed, and it surfaces later as a
support ticket from an integration partner instead of a release note.

## Who it's for

- **API maintainers** cutting a release who want a pre-flight check: "does this spec change
  break anyone currently integrated?"
- **Platform / API-gateway teams** reviewing a partner or internal service's spec update before
  approving it.
- **PMs and support engineers** who need to understand *in English* what changed, without being
  able to read OpenAPI YAML fluently themselves.

None of these people want to install a CLI or read a JSON diff. They want to paste two specs
into a page and read a verdict.

## The core idea

A diff is only useful once it's run through the *semantics* of the format being diffed. Spec
Drift parses both specs into a normalized model, structurally compares them (paths, operations,
parameters, request/response schemas), and classifies every change against a fixed set of
OpenAPI breaking-change rules — not a generic JSON deep-diff. Each classified change is then
rendered as one plain-English sentence describing the concrete client-facing consequence:

> "`user_id` became required on `POST /users` — any client not sending it will now get a 400."

Changes that don't affect a client (a new optional field, a widened enum, a reordered schema
property, a description edit) are shown as safe, not omitted — an engineer approving a release
needs to see "nothing breaks" stated positively, not infer it from silence.

## Key design decisions

- **Classify by OpenAPI semantics, not JSON structure.** The engine understands operations,
  parameters, schemas, and OpenAPI's own notion of "required" — it is not a generic tree diff
  with better formatting. This is what makes the output trustworthy enough to gate a release on.
- **Client-side, static, and stateless.** Specs can contain sensitive internal API surface —
  nothing is uploaded to a server. Parsing and diffing run entirely in the browser; the app
  ships as a static site (see `site_build_dir`/`build_cmd` in the SCOPE status) with no backend.
- **Breaking vs. safe, always both.** Every classified change lands in one of exactly two
  buckets so the report can never be misread as "silence means safe."
- **Shareable without a server.** A report's inputs are small enough to round-trip through a
  URL fragment, so a computed report can be linked to a teammate without standing up storage.
- **Readable by a PM, not just an engineer.** The report is prose sentences with the concrete
  consequence stated, not a rules-engine dump of rule IDs and severities.

## What "v1 done" looks like

- Paste (or upload) an old and new OpenAPI 3.x spec as JSON or YAML.
- Get a report grouped by endpoint, each change classified breaking or safe, each rendered as
  one plain-English sentence naming the concrete client impact.
- The classifier covers the core OpenAPI breaking-change surface: parameter/requirement changes,
  removed paths/operations, request and response schema changes (type narrowing, removed/added
  required fields, enum restriction), and removed enum values.
- Invalid input (malformed JSON/YAML, a non-OpenAPI document) produces an inline, specific error
  — never a crash or a blank page.
- A report can be shared via URL without a backend.
- The whole thing is a static site, deployable to a subpath (e.g.
  `apps.charliekrug.com/spec-drift`) with zero server-side component.
