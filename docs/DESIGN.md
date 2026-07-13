# Design

## 1. Aesthetic direction

**Blueprint/technical.** Spec Drift reads like an engineering drawing of the API: a deep
blueprint-blue canvas, faint graph-paper grid, hairline rules, and corner tick marks — the
visual language of a spec sheet, not a marketing SaaS dashboard. It's precise and quiet, with
breaking changes picked out in a hot annotation red against the cool blue field the way a
reviewer's red pen marks up a drawing. This is a deliberate move away from generic
"dark-gray-cards-plus-one-accent" — the grid, the drafting-line motion, and the blueprint palette
are specific to a tool whose whole premise is *drift between two versions of a technical
document*.

## 2. Tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0b1f3a` | page background |
| `--surface-1` | `#122a4d` | panels, cards |
| `--surface-2` | `#16325c` | raised/hover surface, input fields |
| `--grid-line` | `rgba(148, 197, 255, 0.07)` | graph-paper grid overlay on `--bg` |
| `--text` | `#eaf2ff` | primary text |
| `--text-muted` | `#8ea8d1` | secondary text, labels, captions |
| `--accent` | `#38bdf8` | interactive elements, links, focus rings, headings |
| `--accent-support` | `#f2b134` | badges, highlights, secondary emphasis |
| `--danger` | `#f87171` | breaking changes |
| `--success` | `#34d399` | safe changes |
| Display font | **JetBrains Mono** (system fallback: `ui-monospace, "SF Mono", Consolas, monospace`) | wordmark, headings, endpoint paths, badges |
| UI font | **Inter** (system fallback: `system-ui, -apple-system, sans-serif`) | body text, the plain-English report sentences |
| Spacing unit | 8px scale (8/16/24/32/48/64) | all margins/padding |
| Corner radius | 4px | panels and controls stay sharp-edged, not soft — a drafting tool, not a toy |
| Shadow/glow | `0 0 0 1px rgba(148,197,255,0.12)` hairline border + `0 8px 24px rgba(0,0,0,0.35)` on raised surfaces; interactive focus gets a `0 0 0 3px rgba(56,189,248,0.35)` cyan glow | panels read as drafted sheets, not flat rectangles |
| Motion | UI transitions 150ms ease-out; the diff "measuring line" sweep on report generation runs ~600ms ease-out | keeps interaction snappy, reserves longer motion for the one signature moment |

Rationale for the pairing: JetBrains Mono for anything spec-shaped (paths, field names, the
wordmark) reinforces "this is a technical document," while Inter carries the plain-English
report prose so the actual payoff — the readable sentence — is the most comfortable text on
the page, not the most technical-looking.

## 3. Layout intent

**The hero is the two-spec input, then the report.** Before a diff is run, the paste/upload
panels ARE the page — two large side-by-side text panels (old spec | new spec) filling the
majority of the viewport, framed like two sheets on a drafting table with a thin center
divider. After a diff runs, the report replaces the input as the hero: full-width, grouped by
endpoint, each endpoint an expandable annotation card.

- **1440×900 desktop:** two-column paste panels at ~45% width each with an 8–10% center gutter
  holding the "Compare" action; the report view (post-diff) drops to a single scrollable column
  capped at a comfortable reading measure for the report text and full width for endpoint path
  headers/badges.
- **390×844 phone:** panels stack vertically (old above new), each getting real height (not
  squeezed) — a phone user scrolls between them rather than losing legibility to a cramped
  side-by-side. The report view stacks the same way it does on desktop, one column.
- The input panels and the report both occupy ≥70% of viewport height on both breakpoints —
  no small widget adrift in the blueprint-blue field.

## 4. Signature detail

A **drafting-line sweep**: on hitting Compare, a thin cyan rule animates once across the full
width of the page (~600ms ease-out) as if a drafter's straightedge just measured the two sheets
against each other, then the report reveals underneath. The page background carries a constant
faint graph-paper grid (`--grid-line` on `--bg`), and each panel/card corner gets a small
technical tick mark (a short L-shaped corner bracket, like a drawing's crop marks) reinforcing
the "spec sheet" framing without adding visual noise.

## 5. Juice plan

Not applicable — Spec Drift is a diff/report tool, not a game or playful toy. No game-feel or
synth SFX requirements apply; interaction feedback is limited to the D2 craft-rule states
(hover/focus/active/disabled, 120–250ms transitions) and the signature drafting-line sweep
above.
