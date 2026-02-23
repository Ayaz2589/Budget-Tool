import "@/i18n";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { initializeTheme } from "@/lib/platform/theme";
import { runStorageCleanupMigration } from "@/lib/platform/storageCleanup";

runStorageCleanupMigration();
initializeTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
