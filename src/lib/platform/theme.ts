import { storage, STORAGE_KEYS } from "./storage";

export type AppTheme = "light" | "dark" | "system";

function getThemeMediaQuery(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }
  return window.matchMedia("(prefers-color-scheme: dark)");
}

export function getSystemTheme(): "light" | "dark" {
  const mediaQuery = getThemeMediaQuery();
  return mediaQuery?.matches ? "dark" : "light";
}

export function resolveTheme(theme: AppTheme): "light" | "dark" {
  if (theme === "system") return getSystemTheme();
  return theme;
}

export function getStoredTheme(): AppTheme {
  const stored = storage.getItem(STORAGE_KEYS.THEME);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "dark";
}

export function applyTheme(theme: AppTheme): void {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = resolved;
}

export function initializeTheme(): AppTheme {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}

export function persistTheme(theme: AppTheme): void {
  storage.setItem(STORAGE_KEYS.THEME, theme);
  applyTheme(theme);
}

export function onSystemThemeChange(callback: () => void): () => void {
  const mediaQuery = getThemeMediaQuery();
  if (!mediaQuery) return () => {};
  const handler = () => callback();
  mediaQuery.addEventListener("change", handler);
  return () => mediaQuery.removeEventListener("change", handler);
}
