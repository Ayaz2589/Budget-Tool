import { describe, it, expect, beforeEach } from "bun:test";
import {
  logSyncEvent,
  getSyncLog,
  clearSyncLog,
} from "@/lib/platform/syncLog";
import { STORAGE_KEYS } from "@/lib/platform/storage";

beforeEach(() => {
  localStorage.removeItem(STORAGE_KEYS.SYNC_LOG);
});

describe("syncLog", () => {
  it("getSyncLog returns empty array when no entries exist", () => {
    expect(getSyncLog()).toEqual([]);
  });

  it("logSyncEvent adds entry with timestamp", () => {
    const before = Date.now();
    logSyncEvent({ type: "sync_start" });
    const after = Date.now();

    const log = getSyncLog();
    expect(log).toHaveLength(1);
    expect(log[0].type).toBe("sync_start");
    expect(log[0].timestamp).toBeGreaterThanOrEqual(before);
    expect(log[0].timestamp).toBeLessThanOrEqual(after);
  });

  it("logSyncEvent preserves optional fields", () => {
    logSyncEvent({
      type: "sync_error",
      durationMs: 1500,
      errorMessage: "Network timeout",
      retryCount: 2,
      details: "Failed on sheet write",
    });

    const log = getSyncLog();
    expect(log).toHaveLength(1);
    expect(log[0].durationMs).toBe(1500);
    expect(log[0].errorMessage).toBe("Network timeout");
    expect(log[0].retryCount).toBe(2);
    expect(log[0].details).toBe("Failed on sheet write");
  });

  it("getSyncLog returns entries in order", () => {
    logSyncEvent({ type: "sync_start" });
    logSyncEvent({ type: "sync_success", durationMs: 200 });
    logSyncEvent({ type: "pull_start" });

    const log = getSyncLog();
    expect(log).toHaveLength(3);
    expect(log[0].type).toBe("sync_start");
    expect(log[1].type).toBe("sync_success");
    expect(log[2].type).toBe("pull_start");
  });

  it("log caps at 50 entries with oldest removed", () => {
    // Add 55 entries
    for (let i = 0; i < 55; i++) {
      logSyncEvent({ type: "sync_start", details: `entry-${i}` });
    }

    const log = getSyncLog();
    expect(log).toHaveLength(50);
    // The first 5 entries (entry-0 through entry-4) should have been removed
    expect(log[0].details).toBe("entry-5");
    expect(log[49].details).toBe("entry-54");
  });

  it("clearSyncLog removes all entries", () => {
    logSyncEvent({ type: "sync_start" });
    logSyncEvent({ type: "sync_success" });
    expect(getSyncLog()).toHaveLength(2);

    clearSyncLog();
    expect(getSyncLog()).toEqual([]);
  });

  it("getSyncLog returns empty array for corrupted data", () => {
    localStorage.setItem(STORAGE_KEYS.SYNC_LOG, "not-valid-json");
    expect(getSyncLog()).toEqual([]);
  });

  it("getSyncLog returns empty array for non-array JSON", () => {
    localStorage.setItem(STORAGE_KEYS.SYNC_LOG, '{"foo": "bar"}');
    expect(getSyncLog()).toEqual([]);
  });
});
