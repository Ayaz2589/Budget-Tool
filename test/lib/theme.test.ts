import { beforeEach, describe, test, expect } from "bun:test";
import {
  getStoredTheme,
  applyTheme,
  resolveTheme,
  getSystemTheme,
  initializeTheme,
  persistTheme,
} from "@/lib/theme";
import type { AppTheme } from "@/lib/theme";
import { STORAGE_KEYS } from "@/lib/storage";

beforeEach(() => {
  localStorage.clear();
  // Reset DOM state
  document.documentElement.classList.remove("dark");
  delete document.documentElement.dataset.theme;
});

// ---------------------------------------------------------------------------
// getStoredTheme
// ---------------------------------------------------------------------------

describe("getStoredTheme", () => {
  test("returns 'dark' when nothing is stored", () => {
    expect(getStoredTheme()).toBe("dark");
  });

  test("returns 'light' when stored value is 'light'", () => {
    localStorage.setItem(STORAGE_KEYS.THEME, "light");
    expect(getStoredTheme()).toBe("light");
  });

  test("returns 'dark' when stored value is 'dark'", () => {
    localStorage.setItem(STORAGE_KEYS.THEME, "dark");
    expect(getStoredTheme()).toBe("dark");
  });

  test("returns 'system' when stored value is 'system'", () => {
    localStorage.setItem(STORAGE_KEYS.THEME, "system");
    expect(getStoredTheme()).toBe("system");
  });

  test("returns 'dark' for invalid stored value", () => {
    localStorage.setItem(STORAGE_KEYS.THEME, "invalid-theme");
    expect(getStoredTheme()).toBe("dark");
  });

  test("returns 'dark' for empty string stored value", () => {
    localStorage.setItem(STORAGE_KEYS.THEME, "");
    expect(getStoredTheme()).toBe("dark");
  });
});

// ---------------------------------------------------------------------------
// resolveTheme
// ---------------------------------------------------------------------------

describe("resolveTheme", () => {
  test("returns 'light' for light theme", () => {
    expect(resolveTheme("light")).toBe("light");
  });

  test("returns 'dark' for dark theme", () => {
    expect(resolveTheme("dark")).toBe("dark");
  });

  test("returns a resolved value for system theme", () => {
    const result = resolveTheme("system");
    expect(["light", "dark"]).toContain(result);
  });
});

// ---------------------------------------------------------------------------
// getSystemTheme
// ---------------------------------------------------------------------------

describe("getSystemTheme", () => {
  test("returns either 'light' or 'dark'", () => {
    const result = getSystemTheme();
    expect(["light", "dark"]).toContain(result);
  });
});

// ---------------------------------------------------------------------------
// applyTheme
// ---------------------------------------------------------------------------

describe("applyTheme", () => {
  test("adds 'dark' class and sets data-theme for dark theme", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  test("removes 'dark' class and sets data-theme for light theme", () => {
    // Start with dark
    document.documentElement.classList.add("dark");
    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  test("resolves system theme and applies accordingly", () => {
    applyTheme("system");
    const resolved = getSystemTheme();
    expect(document.documentElement.classList.contains("dark")).toBe(
      resolved === "dark",
    );
    expect(document.documentElement.dataset.theme).toBe(resolved);
  });
});

// ---------------------------------------------------------------------------
// initializeTheme
// ---------------------------------------------------------------------------

describe("initializeTheme", () => {
  test("reads stored theme and applies it, returning the stored value", () => {
    localStorage.setItem(STORAGE_KEYS.THEME, "light");
    const result = initializeTheme();
    expect(result).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  test("defaults to dark when no theme stored", () => {
    const result = initializeTheme();
    expect(result).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// persistTheme
// ---------------------------------------------------------------------------

describe("persistTheme", () => {
  test("saves theme to localStorage and applies it", () => {
    persistTheme("light");
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  test("overwrites previously stored theme", () => {
    persistTheme("dark");
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("dark");

    persistTheme("light");
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
