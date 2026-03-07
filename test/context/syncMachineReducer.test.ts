import { describe, expect, test } from "bun:test";
import {
  syncMachineReducer,
  AUTO_SYNC_DEBOUNCE_MS,
  AUTO_SYNC_INTERVAL_MS,
  SYNC_RATE_LIMIT_BASE_DELAY_MS,
  SYNC_RATE_LIMIT_MAX_DELAY_MS,
  SYNC_TIMEOUT_MS,
  MAX_SYNC_RETRIES,
  type SyncMachineState,
  type SyncMachineAction,
} from "@/lib/sync/syncMachine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeIdleState(overrides?: Partial<SyncMachineState>): SyncMachineState {
  return {
    status: "idle",
    errorMessage: null,
    health: "healthy",
    lastSyncAt: null,
    hasUnsyncedChanges: false,
    isAutoSyncEnabled: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe("sync constants", () => {
  test("AUTO_SYNC_DEBOUNCE_MS is 2 seconds", () => {
    expect(AUTO_SYNC_DEBOUNCE_MS).toBe(2_000);
  });

  test("AUTO_SYNC_INTERVAL_MS is 5 minutes", () => {
    expect(AUTO_SYNC_INTERVAL_MS).toBe(300_000);
  });

  test("SYNC_RATE_LIMIT_BASE_DELAY_MS is 3 seconds", () => {
    expect(SYNC_RATE_LIMIT_BASE_DELAY_MS).toBe(3_000);
  });

  test("SYNC_RATE_LIMIT_MAX_DELAY_MS is 30 seconds", () => {
    expect(SYNC_RATE_LIMIT_MAX_DELAY_MS).toBe(30_000);
  });

  test("SYNC_TIMEOUT_MS is 60 seconds", () => {
    expect(SYNC_TIMEOUT_MS).toBe(60_000);
  });

  test("MAX_SYNC_RETRIES is 5", () => {
    expect(MAX_SYNC_RETRIES).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// START_SYNC
// ---------------------------------------------------------------------------

describe("START_SYNC", () => {
  test("transitions status to syncing", () => {
    const state = makeIdleState();
    const next = syncMachineReducer(state, { type: "START_SYNC" });
    expect(next.status).toBe("syncing");
  });

  test("clears any previous error message", () => {
    const state = makeIdleState({
      status: "error",
      errorMessage: "previous failure",
      health: "error",
    });
    const next = syncMachineReducer(state, { type: "START_SYNC" });
    expect(next.errorMessage).toBeNull();
    expect(next.status).toBe("syncing");
  });

  test("preserves other state fields", () => {
    const state = makeIdleState({
      lastSyncAt: 1000,
      hasUnsyncedChanges: true,
      isAutoSyncEnabled: true,
      health: "warning",
    });
    const next = syncMachineReducer(state, { type: "START_SYNC" });
    expect(next.lastSyncAt).toBe(1000);
    expect(next.hasUnsyncedChanges).toBe(true);
    expect(next.isAutoSyncEnabled).toBe(true);
    expect(next.health).toBe("warning");
  });
});

// ---------------------------------------------------------------------------
// SYNC_SUCCESS
// ---------------------------------------------------------------------------

describe("SYNC_SUCCESS", () => {
  test("transitions status to success", () => {
    const state = makeIdleState({ status: "syncing" });
    const next = syncMachineReducer(state, {
      type: "SYNC_SUCCESS",
      timestamp: 12345,
      hasUnsyncedChanges: false,
    });
    expect(next.status).toBe("success");
  });

  test("sets lastSyncAt to the provided timestamp", () => {
    const state = makeIdleState({ status: "syncing" });
    const ts = Date.now();
    const next = syncMachineReducer(state, {
      type: "SYNC_SUCCESS",
      timestamp: ts,
      hasUnsyncedChanges: false,
    });
    expect(next.lastSyncAt).toBe(ts);
  });

  test("clears error message", () => {
    const state = makeIdleState({
      status: "syncing",
      errorMessage: "old error",
    });
    const next = syncMachineReducer(state, {
      type: "SYNC_SUCCESS",
      timestamp: 1,
      hasUnsyncedChanges: false,
    });
    expect(next.errorMessage).toBeNull();
  });

  test("sets health to healthy", () => {
    const state = makeIdleState({ status: "syncing", health: "warning" });
    const next = syncMachineReducer(state, {
      type: "SYNC_SUCCESS",
      timestamp: 1,
      hasUnsyncedChanges: false,
    });
    expect(next.health).toBe("healthy");
  });

  test("sets hasUnsyncedChanges from the action payload", () => {
    const state = makeIdleState({ status: "syncing" });
    const next = syncMachineReducer(state, {
      type: "SYNC_SUCCESS",
      timestamp: 1,
      hasUnsyncedChanges: true,
    });
    expect(next.hasUnsyncedChanges).toBe(true);
  });

  test("preserves isAutoSyncEnabled", () => {
    const state = makeIdleState({
      status: "syncing",
      isAutoSyncEnabled: true,
    });
    const next = syncMachineReducer(state, {
      type: "SYNC_SUCCESS",
      timestamp: 1,
      hasUnsyncedChanges: false,
    });
    expect(next.isAutoSyncEnabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SYNC_ERROR
// ---------------------------------------------------------------------------

describe("SYNC_ERROR", () => {
  test("sets error message from action", () => {
    const state = makeIdleState({ status: "syncing" });
    const next = syncMachineReducer(state, {
      type: "SYNC_ERROR",
      message: "Network failure",
      health: "error",
    });
    expect(next.errorMessage).toBe("Network failure");
  });

  test("sets health from action", () => {
    const state = makeIdleState({ status: "syncing" });
    const next = syncMachineReducer(state, {
      type: "SYNC_ERROR",
      message: "Rate limited",
      health: "warning",
    });
    expect(next.health).toBe("warning");
  });

  test("defaults status to error when no status override provided", () => {
    const state = makeIdleState({ status: "syncing" });
    const next = syncMachineReducer(state, {
      type: "SYNC_ERROR",
      message: "failed",
      health: "error",
    });
    expect(next.status).toBe("error");
  });

  test("uses status override when provided", () => {
    const state = makeIdleState({ status: "syncing" });
    const next = syncMachineReducer(state, {
      type: "SYNC_ERROR",
      message: "Rate limited, retrying",
      health: "warning",
      status: "idle",
    });
    expect(next.status).toBe("idle");
  });

  test("preserves other state fields", () => {
    const state = makeIdleState({
      status: "syncing",
      lastSyncAt: 5000,
      hasUnsyncedChanges: true,
      isAutoSyncEnabled: true,
    });
    const next = syncMachineReducer(state, {
      type: "SYNC_ERROR",
      message: "fail",
      health: "error",
    });
    expect(next.lastSyncAt).toBe(5000);
    expect(next.hasUnsyncedChanges).toBe(true);
    expect(next.isAutoSyncEnabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SET_UNSYNCED
// ---------------------------------------------------------------------------

describe("SET_UNSYNCED", () => {
  test("sets hasUnsyncedChanges to true", () => {
    const state = makeIdleState();
    const next = syncMachineReducer(state, {
      type: "SET_UNSYNCED",
      hasUnsyncedChanges: true,
      health: "warning",
    });
    expect(next.hasUnsyncedChanges).toBe(true);
  });

  test("sets hasUnsyncedChanges to false", () => {
    const state = makeIdleState({ hasUnsyncedChanges: true });
    const next = syncMachineReducer(state, {
      type: "SET_UNSYNCED",
      hasUnsyncedChanges: false,
      health: "healthy",
    });
    expect(next.hasUnsyncedChanges).toBe(false);
  });

  test("sets health from action", () => {
    const state = makeIdleState();
    const next = syncMachineReducer(state, {
      type: "SET_UNSYNCED",
      hasUnsyncedChanges: true,
      health: "warning",
    });
    expect(next.health).toBe("warning");
  });

  test("preserves status, errorMessage, lastSyncAt, isAutoSyncEnabled", () => {
    const state = makeIdleState({
      status: "success",
      errorMessage: null,
      lastSyncAt: 9999,
      isAutoSyncEnabled: true,
    });
    const next = syncMachineReducer(state, {
      type: "SET_UNSYNCED",
      hasUnsyncedChanges: true,
      health: "warning",
    });
    expect(next.status).toBe("success");
    expect(next.errorMessage).toBeNull();
    expect(next.lastSyncAt).toBe(9999);
    expect(next.isAutoSyncEnabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SET_AUTO_SYNC
// ---------------------------------------------------------------------------

describe("SET_AUTO_SYNC", () => {
  test("enables auto sync", () => {
    const state = makeIdleState({ isAutoSyncEnabled: false });
    const next = syncMachineReducer(state, {
      type: "SET_AUTO_SYNC",
      enabled: true,
    });
    expect(next.isAutoSyncEnabled).toBe(true);
  });

  test("disables auto sync", () => {
    const state = makeIdleState({ isAutoSyncEnabled: true });
    const next = syncMachineReducer(state, {
      type: "SET_AUTO_SYNC",
      enabled: false,
    });
    expect(next.isAutoSyncEnabled).toBe(false);
  });

  test("preserves all other state fields", () => {
    const state = makeIdleState({
      status: "success",
      errorMessage: "some msg",
      health: "warning",
      lastSyncAt: 42,
      hasUnsyncedChanges: true,
      isAutoSyncEnabled: false,
    });
    const next = syncMachineReducer(state, {
      type: "SET_AUTO_SYNC",
      enabled: true,
    });
    expect(next.status).toBe("success");
    expect(next.errorMessage).toBe("some msg");
    expect(next.health).toBe("warning");
    expect(next.lastSyncAt).toBe(42);
    expect(next.hasUnsyncedChanges).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// RESET_UNSYNCED
// ---------------------------------------------------------------------------

describe("RESET_UNSYNCED", () => {
  test("clears hasUnsyncedChanges", () => {
    const state = makeIdleState({ hasUnsyncedChanges: true });
    const next = syncMachineReducer(state, { type: "RESET_UNSYNCED" });
    expect(next.hasUnsyncedChanges).toBe(false);
  });

  test("sets health to healthy", () => {
    const state = makeIdleState({
      hasUnsyncedChanges: true,
      health: "warning",
    });
    const next = syncMachineReducer(state, { type: "RESET_UNSYNCED" });
    expect(next.health).toBe("healthy");
  });

  test("preserves status, errorMessage, lastSyncAt, isAutoSyncEnabled", () => {
    const state = makeIdleState({
      status: "error",
      errorMessage: "something",
      lastSyncAt: 7777,
      isAutoSyncEnabled: true,
      hasUnsyncedChanges: true,
      health: "error",
    });
    const next = syncMachineReducer(state, { type: "RESET_UNSYNCED" });
    expect(next.status).toBe("error");
    expect(next.errorMessage).toBe("something");
    expect(next.lastSyncAt).toBe(7777);
    expect(next.isAutoSyncEnabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// RESET
// ---------------------------------------------------------------------------

describe("RESET", () => {
  test("resets status to idle", () => {
    const state = makeIdleState({ status: "syncing" });
    const next = syncMachineReducer(state, { type: "RESET" });
    expect(next.status).toBe("idle");
  });

  test("clears errorMessage", () => {
    const state = makeIdleState({ errorMessage: "old error" });
    const next = syncMachineReducer(state, { type: "RESET" });
    expect(next.errorMessage).toBeNull();
  });

  test("resets health to healthy", () => {
    const state = makeIdleState({ health: "error" });
    const next = syncMachineReducer(state, { type: "RESET" });
    expect(next.health).toBe("healthy");
  });

  test("clears lastSyncAt", () => {
    const state = makeIdleState({ lastSyncAt: 99999 });
    const next = syncMachineReducer(state, { type: "RESET" });
    expect(next.lastSyncAt).toBeNull();
  });

  test("clears hasUnsyncedChanges", () => {
    const state = makeIdleState({ hasUnsyncedChanges: true });
    const next = syncMachineReducer(state, { type: "RESET" });
    expect(next.hasUnsyncedChanges).toBe(false);
  });

  test("preserves isAutoSyncEnabled when true", () => {
    const state = makeIdleState({
      status: "error",
      errorMessage: "crash",
      health: "error",
      lastSyncAt: 123,
      hasUnsyncedChanges: true,
      isAutoSyncEnabled: true,
    });
    const next = syncMachineReducer(state, { type: "RESET" });
    expect(next.isAutoSyncEnabled).toBe(true);
  });

  test("preserves isAutoSyncEnabled when false", () => {
    const state = makeIdleState({
      status: "success",
      lastSyncAt: 456,
      isAutoSyncEnabled: false,
    });
    const next = syncMachineReducer(state, { type: "RESET" });
    expect(next.isAutoSyncEnabled).toBe(false);
  });

  test("full reset from a dirty state", () => {
    const state: SyncMachineState = {
      status: "error",
      errorMessage: "Something went wrong",
      health: "error",
      lastSyncAt: 1234567890,
      hasUnsyncedChanges: true,
      isAutoSyncEnabled: true,
    };
    const next = syncMachineReducer(state, { type: "RESET" });
    expect(next).toEqual({
      status: "idle",
      errorMessage: null,
      health: "healthy",
      lastSyncAt: null,
      hasUnsyncedChanges: false,
      isAutoSyncEnabled: true,
    });
  });
});

// ---------------------------------------------------------------------------
// Reducer purity
// ---------------------------------------------------------------------------

describe("reducer purity", () => {
  test("does not mutate the original state", () => {
    const state = makeIdleState();
    const frozen = Object.freeze(state);
    // If the reducer mutated state, Object.freeze would throw
    const next = syncMachineReducer(frozen, { type: "START_SYNC" });
    expect(next).not.toBe(state);
    expect(next.status).toBe("syncing");
    expect(state.status).toBe("idle");
  });

  test("returns a new object reference on every action", () => {
    const state = makeIdleState();
    const actions: SyncMachineAction[] = [
      { type: "START_SYNC" },
      { type: "SYNC_SUCCESS", timestamp: 1, hasUnsyncedChanges: false },
      { type: "SYNC_ERROR", message: "x", health: "error" },
      { type: "SET_UNSYNCED", hasUnsyncedChanges: true, health: "warning" },
      { type: "SET_AUTO_SYNC", enabled: true },
      { type: "RESET_UNSYNCED" },
      { type: "RESET" },
    ];
    for (const action of actions) {
      const next = syncMachineReducer(state, action);
      expect(next).not.toBe(state);
    }
  });
});
