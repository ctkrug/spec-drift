const SHELL_HTML = `
  <header class="topbar">
    <p class="wordmark">Spec<span class="wordmark-accent">Drift</span></p>
    <p class="tagline">Paste your old and new OpenAPI specs. Get a plain-English breaking-change report.</p>
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

  <section class="report" id="report" hidden aria-live="polite"></section>
`;

export function mountApp(root: HTMLElement): void {
  root.innerHTML = SHELL_HTML;
}
