/**
 * Simple hash-based dirty tracking for sync models.
 * Compares current data hash against last synced hash per model.
 */

/** FNV-1a 32-bit hash for fast string hashing */
function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export type SyncModelName =
  | "expenses"
  | "mortgage"
  | "income"
  | "debts"
  | "debtPayments"
  | "ownerTransfers"
  | "presetTransactions";

export interface DirtyTracker {
  /** Record the hash of data that was just synced for a model */
  markSynced(model: SyncModelName, data: unknown[]): void;
  /** Check if a model's data has changed since last sync */
  isDirty(model: SyncModelName, data: unknown[]): boolean;
  /** Check if ANY of the provided model/data pairs have changed */
  isAnyDirty(entries: Array<[SyncModelName, unknown[]]>): boolean;
  /** Reset all tracked hashes (e.g. when switching spreadsheets) */
  reset(): void;
}

export function createDirtyTracker(): DirtyTracker {
  const lastSyncedHashes = new Map<SyncModelName, string>();

  function hashData(data: unknown[]): string {
    return fnv1aHash(JSON.stringify(data));
  }

  return {
    markSynced(model, data) {
      lastSyncedHashes.set(model, hashData(data));
    },
    isDirty(model, data) {
      const lastHash = lastSyncedHashes.get(model);
      if (lastHash === undefined) return true; // never synced = dirty
      return hashData(data) !== lastHash;
    },
    isAnyDirty(entries) {
      return entries.some(([model, data]) => {
        const lastHash = lastSyncedHashes.get(model);
        if (lastHash === undefined) return true;
        return hashData(data) !== lastHash;
      });
    },
    reset() {
      lastSyncedHashes.clear();
    },
  };
}
