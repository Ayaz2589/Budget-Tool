/**
 * Storage abstraction layer.
 *
 * Wraps `localStorage` with proper error handling so callers don't need
 * individual try/catch blocks.  Quota-exceeded errors are logged to the
 * console; all other errors are silently swallowed (matching the existing
 * behaviour across the codebase).
 *
 * Also centralises every storage key used by the application.
 */

// ---------------------------------------------------------------------------
// Storage adapter interface & implementation
// ---------------------------------------------------------------------------

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function isQuotaExceededError(err: unknown): boolean {
  if (err instanceof DOMException) {
    return (
      err.code === 22 ||
      err.code === 1014 ||
      err.name === "QuotaExceededError" ||
      err.name === "NS_ERROR_DOM_QUOTA_REACHED"
    );
  }
  // Handle environments where DOMException instanceof check may fail
  if (typeof err === "object" && err !== null) {
    const e = err as { name?: string; code?: number };
    return e.name === "QuotaExceededError" || e.code === 22;
  }
  return false;
}

function createLocalStorageAdapter(): StorageAdapter {
  return {
    getItem(key: string): string | null {
      try {
        if (typeof localStorage === "undefined") return null;
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },

    setItem(key: string, value: string): void {
      try {
        if (typeof localStorage === "undefined") return;
        localStorage.setItem(key, value);
      } catch (err) {
        if (isQuotaExceededError(err)) {
          console.error(
            `[storage] Quota exceeded while writing key "${key}" (${value.length} chars)`,
          );
        }
        // Silently swallow other errors (e.g. SecurityError in sandboxed iframes)
      }
    },

    removeItem(key: string): void {
      try {
        if (typeof localStorage === "undefined") return;
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    },
  };
}

/** Singleton storage adapter. */
export const storage: StorageAdapter = createLocalStorageAdapter();

// ---------------------------------------------------------------------------
// Centralised storage keys
// ---------------------------------------------------------------------------

export const STORAGE_KEYS = {
  // Budget data
  BUDGET_DATA: "budget-tool-data",
  DUMMY_MODE: "budget-tool-dummy-mode",
  UI_FORMAT: "budget-tool-ui-format",

  // Google auth / sync
  SPREADSHEET_ID: "budget-tool-spreadsheet-id",
  ACCESS_TOKEN: "budget-tool-google-access-token",
  AUTO_SYNC_ENABLED: "budget-tool-auto-sync-enabled",
  RETURNING_USER: "budget-tool-returning-user",
  TOUR_COMPLETED: "budget-tool-tour-completed",

  // Preset transactions
  PRESET_TRANSACTIONS: "budget-tool-preset-transactions",

  // FX cache (prefix — actual keys are `budget-tool-fx-usd-{currency}`)
  FX_CACHE_PREFIX: "budget-tool-fx-usd-",

  // Theme
  THEME: "ortho-theme",

  // Locale
  LOCALE: "ortho-locale",

  // Layout help hint
  HELP_HINT_SEEN: "budget-tool-help-hint-seen",

  // Dashboard widget layout
  DASHBOARD_LAYOUT: "budget-tool-dashboard-layout",

  // Sidebar collapsed state
  SIDEBAR_COLLAPSED: "budget-tool-sidebar-collapsed",

  // Sync event log
  SYNC_LOG: "budget-tool-sync-log",
} as const;
