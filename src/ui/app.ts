import type { Change } from "../core/types";
import { compareSpecs } from "./compare";
import { buildReportMarkdown } from "./report";
import { SAMPLE_NEW_SPEC, SAMPLE_OLD_SPEC } from "./samples";
import { decodeShareFragment, encodeShareFragment } from "./share";

const SHELL_HTML = `
  <div class="sweep-line" id="sweep-line" aria-hidden="true"></div>
  <header class="topbar">
    <p class="wordmark">Spec<span class="wordmark-accent">Drift</span></p>
    <p class="tagline">Paste your old and new OpenAPI specs. Get a plain-English breaking-change report.</p>
    <button class="sample-btn" id="sample-btn" type="button">Load sample spec pair</button>
  </header>
  <main class="workspace" id="workspace">
    <section class="pane" data-role="old">
      <div class="pane-header">
        <h2 class="pane-title">Old spec</h2>
        <label class="upload-btn" for="upload-old">
          Upload
          <input id="upload-old" class="upload-input" type="file" accept=".json,.yaml,.yml" />
        </label>
      </div>
      <textarea
        class="pane-input"
        id="input-old"
        spellcheck="false"
        placeholder="Paste OpenAPI JSON or YAML..."
        aria-label="Old OpenAPI spec"
      ></textarea>
      <p class="pane-error" id="error-old" role="alert"></p>
    </section>

    <div class="gutter">
      <button class="compare-btn" id="compare-btn" type="button">Compare</button>
    </div>

    <section class="pane" data-role="new">
      <div class="pane-header">
        <h2 class="pane-title">New spec</h2>
        <label class="upload-btn" for="upload-new">
          Upload
          <input id="upload-new" class="upload-input" type="file" accept=".json,.yaml,.yml" />
        </label>
      </div>
      <textarea
        class="pane-input"
        id="input-new"
        spellcheck="false"
        placeholder="Paste OpenAPI JSON or YAML..."
        aria-label="New OpenAPI spec"
      ></textarea>
      <p class="pane-error" id="error-new" role="alert"></p>
    </section>
  </main>

  <section class="report-wrap" id="report-wrap" hidden>
    <div class="report-toolbar">
      <button class="export-btn" id="export-btn" type="button">Export .md</button>
      <button class="share-btn" id="share-btn" type="button">Copy share link</button>
      <span class="share-status" id="share-status" role="status" aria-live="polite"></span>
    </div>
    <div class="report" id="report" aria-live="polite"></div>
  </section>
`;

function requireElement<T extends Element>(root: HTMLElement, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Expected element matching "${selector}" in app shell`);
  return el;
}

/**
 * Runs the drafting-line sweep across the page (~600ms) and reveals the
 * report once it finishes, so the report appears to land underneath the
 * measuring line rather than popping in. Skipped entirely under
 * prefers-reduced-motion — the report reveal itself is unaffected.
 */
function sweepThenReveal(sweepLine: HTMLElement, reveal: () => void): void {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    reveal();
    return;
  }

  sweepLine.classList.remove("is-active");
  // Force a reflow so re-adding the class restarts the animation on repeat clicks.
  void sweepLine.offsetWidth;
  sweepLine.classList.add("is-active");
  sweepLine.addEventListener("animationend", () => reveal(), { once: true });
}

/** Triggers a browser download of `content` as a file named `filename`. */
function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function wireUpload(input: HTMLInputElement, textarea: HTMLTextAreaElement): void {
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      textarea.value = typeof reader.result === "string" ? reader.result : "";
    };
    reader.readAsText(file);
  });
}

export function mountApp(root: HTMLElement): void {
  root.innerHTML = SHELL_HTML;

  const oldInput = requireElement<HTMLTextAreaElement>(root, "#input-old");
  const newInput = requireElement<HTMLTextAreaElement>(root, "#input-new");
  const oldError = requireElement<HTMLElement>(root, "#error-old");
  const newError = requireElement<HTMLElement>(root, "#error-new");
  const compareBtn = requireElement<HTMLButtonElement>(root, "#compare-btn");
  const reportWrap = requireElement<HTMLElement>(root, "#report-wrap");
  const report = requireElement<HTMLElement>(root, "#report");
  const exportBtn = requireElement<HTMLButtonElement>(root, "#export-btn");
  const shareBtn = requireElement<HTMLButtonElement>(root, "#share-btn");
  const shareStatus = requireElement<HTMLElement>(root, "#share-status");
  const sweepLine = requireElement<HTMLElement>(root, "#sweep-line");

  let latestChanges: Change[] | null = null;

  function runCompare(animate: boolean): void {
    const result = compareSpecs(oldInput.value, newInput.value);
    oldError.textContent = result.oldError ?? "";
    newError.textContent = result.newError ?? "";
    latestChanges = result.changes;

    if (result.reportHtml === null) {
      reportWrap.hidden = true;
      report.innerHTML = "";
      return;
    }

    const reveal = () => {
      report.innerHTML = result.reportHtml as string;
      reportWrap.hidden = false;
    };
    if (animate) {
      sweepThenReveal(sweepLine, reveal);
    } else {
      reveal();
    }
  }

  compareBtn.addEventListener("click", () => runCompare(true));

  exportBtn.addEventListener("click", () => {
    if (!latestChanges) return;
    downloadTextFile("spec-drift-report.md", buildReportMarkdown(latestChanges), "text/markdown");
  });

  shareBtn.addEventListener("click", () => {
    const fragment = encodeShareFragment(oldInput.value, newInput.value);
    if (!fragment) {
      shareStatus.textContent = "Spec pair is too large to share via a link.";
      return;
    }

    const shareUrl = `${window.location.origin}${window.location.pathname}#${fragment}`;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        shareStatus.textContent = "Link copied to clipboard.";
      })
      .catch(() => {
        shareStatus.textContent = "Couldn't copy the link — copy it from the address bar instead.";
      });
  });

  wireUpload(requireElement<HTMLInputElement>(root, "#upload-old"), oldInput);
  wireUpload(requireElement<HTMLInputElement>(root, "#upload-new"), newInput);

  const sampleBtn = requireElement<HTMLButtonElement>(root, "#sample-btn");
  sampleBtn.addEventListener("click", () => {
    oldInput.value = SAMPLE_OLD_SPEC;
    newInput.value = SAMPLE_NEW_SPEC;
    oldError.textContent = "";
    newError.textContent = "";
  });

  const shared = decodeShareFragment(window.location.hash.slice(1));
  if (shared) {
    oldInput.value = shared.oldText;
    newInput.value = shared.newText;
    runCompare(false);
  }
}
