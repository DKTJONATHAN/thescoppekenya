import { hydrateRoot, createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { HelmetProvider } from "react-helmet-async";

const container = document.getElementById("root");

if (container?.hasChildNodes()) {
  // If the HTML is pre-rendered by react-snap, we hydrate it
  hydrateRoot(
    container,
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
} else {
  // Fallback for normal SPA behavior during local dev
  createRoot(container!).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
}
