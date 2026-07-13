import "./style.css";
import { mountApp } from "./ui/app";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("#app root element not found");
}

mountApp(app);
