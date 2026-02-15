import { DISPLAY_CURRENCIES } from "@/types/currency";
import { storage, STORAGE_KEYS } from "@/lib/storage";

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

function isSupportedFxKey(key: string): boolean {
  if (!key.startsWith(STORAGE_KEYS.FX_CACHE_PREFIX)) return true;
  const code = key.slice(STORAGE_KEYS.FX_CACHE_PREFIX.length).toUpperCase();
  return (
    code !== "USD" &&
    (DISPLAY_CURRENCIES as string[]).includes(code)
  );
}

export function runStorageCleanupMigration(): void {
  if (typeof localStorage === "undefined") return;

  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      storage.removeItem(key);
    }

    // Iterate over raw localStorage to discover keys that need cleaning.
    // The StorageAdapter interface doesn't expose iteration, so we access
    // localStorage directly here -- guarded by the typeof check above.
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
      storage.removeItem(key);
    }
  } catch {
    // ignore localStorage cleanup failures
  }
}
