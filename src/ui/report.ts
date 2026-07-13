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

function escapeHtml(value: string): string {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

/**
 * Renders a classified change list into the report container, grouped by
 * endpoint within two always-present sections (breaking, then safe) so a
 * zero-breaking-changes result reads as an explicit "nothing breaks"
 * rather than an empty page.
 */
export function renderReport(container: HTMLElement, changes: Change[]): void {
  if (changes.length === 0) {
    container.innerHTML = `
      <p class="report-empty">No differences detected — the two specs are identical.</p>
    `;
    container.hidden = false;
    return;
  }

  const breaking = changes.filter((c) => c.severity === "breaking");
  const safe = changes.filter((c) => c.severity === "safe");

  container.innerHTML = `
    <p class="report-summary">
      <span class="report-summary-breaking">${breaking.length} breaking</span> ·
      <span class="report-summary-safe">${safe.length} safe</span>
    </p>
    ${renderSection("Breaking changes", "breaking", breaking)}
    ${renderSection("Safe changes", "safe", safe)}
  `;
  container.hidden = false;
}
