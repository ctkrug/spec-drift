import type { Change } from "../core/types";

function endpointLabel(change: Change): string {
  return change.method === "*" ? change.path : `${change.method.toUpperCase()} ${change.path}`;
}

function groupByEndpoint(changes: Change[]): Map<string, Change[]> {
  const groups = new Map<string, Change[]>();
  for (const change of changes) {
    const label = endpointLabel(change);
    const group = groups.get(label);
    if (group) {
      group.push(change);
    } else {
      groups.set(label, [change]);
    }
  }
  return groups;
}

function renderSection(title: string, severityClass: "breaking" | "safe", changes: Change[]): string {
  if (changes.length === 0) return "";

  const groups = groupByEndpoint(changes);
  const cards = [...groups.entries()]
    .map(
      ([endpoint, endpointChanges]) => `
        <article class="endpoint-card">
          <p class="endpoint-badge">${escapeHtml(endpoint)}</p>
          <ul class="change-list">
            ${endpointChanges
              .map((c) => `<li class="change change--${severityClass}">${escapeHtml(c.message)}</li>`)
              .join("")}
          </ul>
        </article>
      `,
    )
    .join("");

  return `
    <section class="report-section report-section--${severityClass}">
      <h3 class="report-section-title">${title} (${changes.length})</h3>
      <div class="endpoint-group">${cards}</div>
    </section>
  `;
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/**
 * Builds the report markup for a classified change list, grouped by
 * endpoint within two always-present sections (breaking, then safe) so a
 * zero-breaking-changes result reads as an explicit "nothing breaks"
 * rather than an empty page. Pure string-building, kept separate from DOM
 * mutation so it's testable without a browser environment.
 */
export function buildReportHtml(changes: Change[]): string {
  if (changes.length === 0) {
    return `<p class="report-empty">No differences detected — the two specs are identical.</p>`;
  }

  const breaking = changes.filter((c) => c.severity === "breaking");
  const safe = changes.filter((c) => c.severity === "safe");

  return `
    <p class="report-summary">
      <span class="report-summary-breaking">${breaking.length} breaking</span> ·
      <span class="report-summary-safe">${safe.length} safe</span>
    </p>
    ${renderSection("Breaking changes", "breaking", breaking)}
    ${renderSection("Safe changes", "safe", safe)}
  `;
}

/** Renders a classified change list into the report container. */
export function renderReport(container: HTMLElement, changes: Change[]): void {
  container.innerHTML = buildReportHtml(changes);
  container.hidden = false;
}
