import type { SyncHealth, SyncStatus } from "@/types/auth";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const AUTO_SYNC_DEBOUNCE_MS = 2_000;
export const AUTO_SYNC_INTERVAL_MS = 5 * 60_000;
export const SYNC_RATE_LIMIT_BASE_DELAY_MS = 3_000;
export const SYNC_RATE_LIMIT_MAX_DELAY_MS = 30_000;
export const SYNC_TIMEOUT_MS = 60_000;
export const MAX_SYNC_RETRIES = 5;

// ---------------------------------------------------------------------------
// Sync state machine
// ---------------------------------------------------------------------------

export interface SyncMachineState {
  status: SyncStatus;
  errorMessage: string | null;
  health: SyncHealth;
  lastSyncAt: number | null;
  hasUnsyncedChanges: boolean;
  isAutoSyncEnabled: boolean;
}

export type SyncMachineAction =
  | { type: "START_SYNC" }
  | { type: "SYNC_SUCCESS"; timestamp: number; hasUnsyncedChanges: boolean }
  | {
      type: "SYNC_ERROR";
      message: string;
      health: SyncHealth;
      status?: SyncStatus;
    }
  | { type: "SET_UNSYNCED"; hasUnsyncedChanges: boolean; health: SyncHealth }
  | { type: "SET_AUTO_SYNC"; enabled: boolean }
  | { type: "RESET_UNSYNCED" }
  | { type: "RESET" };

export function syncMachineReducer(
  state: SyncMachineState,
  action: SyncMachineAction,
): SyncMachineState {
  switch (action.type) {
    case "START_SYNC":
      return { ...state, status: "syncing", errorMessage: null };
    case "SYNC_SUCCESS":
      return {
        ...state,
        status: "success",
        errorMessage: null,
        health: "healthy",
        lastSyncAt: action.timestamp,
        hasUnsyncedChanges: action.hasUnsyncedChanges,
      };
    case "SYNC_ERROR":
      return {
        ...state,
        status: action.status ?? "error",
        errorMessage: action.message,
        health: action.health,
      };
    case "SET_UNSYNCED":
      return {
        ...state,
        hasUnsyncedChanges: action.hasUnsyncedChanges,
        health: action.health,
      };
    case "SET_AUTO_SYNC":
      return { ...state, isAutoSyncEnabled: action.enabled };
    case "RESET_UNSYNCED":
      return { ...state, hasUnsyncedChanges: false, health: "healthy" };
    case "RESET":
      return {
        status: "idle",
        errorMessage: null,
        health: "healthy",
        lastSyncAt: null,
        hasUnsyncedChanges: false,
        isAutoSyncEnabled: state.isAutoSyncEnabled,
      };
  }
}
