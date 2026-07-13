import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("#app root element not found");
}

app.innerHTML = `
  <h1>Spec Drift</h1>
  <p>Paste your old and new OpenAPI specs, get a plain-English breaking-change report.</p>
  <p><em>Under construction — see docs/BACKLOG.md for the build plan.</em></p>
`;
