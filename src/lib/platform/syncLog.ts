import { storage, STORAGE_KEYS } from "./storage";

export type SyncEventType =
  | "sync_start"
  | "sync_success"
  | "sync_error"
  | "sync_retry"
  | "sync_timeout"
  | "pull_start"
  | "pull_success"
  | "pull_error"
  | "blob_fallback";

export interface SyncLogEntry {
  type: SyncEventType;
  timestamp: number;
  durationMs?: number;
  errorMessage?: string;
  retryCount?: number;
  details?: string;
}

const MAX_LOG_ENTRIES = 50;

export function logSyncEvent(
  entry: Omit<SyncLogEntry, "timestamp">,
): void {
  const log = getSyncLog();
  const fullEntry: SyncLogEntry = { ...entry, timestamp: Date.now() };
  log.push(fullEntry);

  // Cap at MAX_LOG_ENTRIES, removing oldest entries first
  const trimmed = log.length > MAX_LOG_ENTRIES
    ? log.slice(log.length - MAX_LOG_ENTRIES)
    : log;

  storage.setItem(STORAGE_KEYS.SYNC_LOG, JSON.stringify(trimmed));
}

export function getSyncLog(): SyncLogEntry[] {
  const raw = storage.getItem(STORAGE_KEYS.SYNC_LOG);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SyncLogEntry[];
  } catch {
    return [];
  }
}

export function clearSyncLog(): void {
  storage.removeItem(STORAGE_KEYS.SYNC_LOG);
}
