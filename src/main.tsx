import { createRoot, hydrateRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

const container = document.getElementById("root")!;
const app = (
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

// Public pages ship prerendered HTML; hydrate them. Private (SPA-only) pages render fresh.
const prerendered = container.getAttribute("data-prerendered");
const path = window.location.pathname.replace(/\/+$/, "") || "/";
if (prerendered && prerendered === path) {
  hydrateRoot(container, app);
} else {
  // SPA fallback served another page's HTML (e.g. private routes): discard it.
  container.innerHTML = "";
  createRoot(container).render(app);
}
