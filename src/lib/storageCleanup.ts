import { DISPLAY_CURRENCIES } from "@/types/currency";

const LEGACY_STORAGE_KEYS = [
  "budget-tool-dashboard-dummy",
  "budget-tool-tour-seen-income",
  "budget-tool-tour-seen-mortgage",
  "budget-tool-tour-seen-rules",
  "budget-tool-tour-seen-transactions",
];

const LEGACY_STORAGE_PREFIXES = [
  "budget-tool-tour-seen-",
];

const FX_STORAGE_PREFIX = "budget-tool-fx-usd-";

function isSupportedFxKey(key: string): boolean {
  if (!key.startsWith(FX_STORAGE_PREFIX)) return true;
  const code = key.slice(FX_STORAGE_PREFIX.length).toUpperCase();
  return (
    code !== "USD" &&
    (DISPLAY_CURRENCIES as string[]).includes(code)
  );
}

export function runStorageCleanupMigration(): void {
  if (typeof localStorage === "undefined") return;

  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }

    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (LEGACY_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        toRemove.push(key);
        continue;
      }

      if (!isSupportedFxKey(key)) {
        toRemove.push(key);
      }
    }

    for (const key of toRemove) {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore localStorage cleanup failures
  }
}
