import { beforeEach, describe, expect, test } from "bun:test";
import { storage, STORAGE_KEYS, type StorageAdapter } from "@/lib/platform/storage";

beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// STORAGE_KEYS completeness
// ---------------------------------------------------------------------------

describe("STORAGE_KEYS", () => {
  test("contains all expected keys", () => {
    expect(STORAGE_KEYS.BUDGET_DATA).toBe("budget-tool-data");
    expect(STORAGE_KEYS.DUMMY_MODE).toBe("budget-tool-dummy-mode");
    expect(STORAGE_KEYS.UI_FORMAT).toBe("budget-tool-ui-format");
    expect(STORAGE_KEYS.SPREADSHEET_ID).toBe("budget-tool-spreadsheet-id");
    expect(STORAGE_KEYS.ACCESS_TOKEN).toBe("budget-tool-google-access-token");
    expect(STORAGE_KEYS.AUTO_SYNC_ENABLED).toBe("budget-tool-auto-sync-enabled");
    expect(STORAGE_KEYS.RETURNING_USER).toBe("budget-tool-returning-user");
    expect(STORAGE_KEYS.TOUR_COMPLETED).toBe("budget-tool-tour-completed");
    expect(STORAGE_KEYS.PRESET_TRANSACTIONS).toBe("budget-tool-preset-transactions");
    expect(STORAGE_KEYS.FX_CACHE_PREFIX).toBe("budget-tool-fx-usd-");
    expect(STORAGE_KEYS.THEME).toBe("ortho-theme");
    expect(STORAGE_KEYS.LOCALE).toBe("ortho-locale");
    expect(STORAGE_KEYS.HELP_HINT_SEEN).toBe("budget-tool-help-hint-seen");
  });

  test("is a const object (all values are strings)", () => {
    const values = Object.values(STORAGE_KEYS);
    expect(values.length).toBeGreaterThanOrEqual(13);
    for (const val of values) {
      expect(typeof val).toBe("string");
    }
  });
});

// ---------------------------------------------------------------------------
// StorageAdapter basic operations
// ---------------------------------------------------------------------------

describe("storage adapter", () => {
  test("getItem returns null for missing key", () => {
    expect(storage.getItem("nonexistent-key")).toBeNull();
  });

  test("setItem and getItem round-trip a string value", () => {
    storage.setItem("test-key", "hello");
    expect(storage.getItem("test-key")).toBe("hello");
  });

  test("removeItem deletes a key", () => {
    storage.setItem("test-key", "hello");
    storage.removeItem("test-key");
    expect(storage.getItem("test-key")).toBeNull();
  });

  test("removeItem is safe to call for nonexistent key", () => {
    expect(() => storage.removeItem("nonexistent")).not.toThrow();
  });

  test("setItem overwrites existing value", () => {
    storage.setItem("test-key", "first");
    storage.setItem("test-key", "second");
    expect(storage.getItem("test-key")).toBe("second");
  });
});

// ---------------------------------------------------------------------------
// JSON serialisation works through the adapter
// ---------------------------------------------------------------------------

describe("storage adapter with JSON", () => {
  test("round-trips a JSON object", () => {
    const data = { expenses: [{ id: "1", amount: 42.5 }], count: 3 };
    storage.setItem(STORAGE_KEYS.BUDGET_DATA, JSON.stringify(data));

    const raw = storage.getItem(STORAGE_KEYS.BUDGET_DATA);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed).toEqual(data);
  });

  test("round-trips an array", () => {
    const presets = [{ id: "p1", description: "Rent" }];
    storage.setItem(STORAGE_KEYS.PRESET_TRANSACTIONS, JSON.stringify(presets));

    const raw = storage.getItem(STORAGE_KEYS.PRESET_TRANSACTIONS);
    expect(JSON.parse(raw!)).toEqual(presets);
  });
});

// ---------------------------------------------------------------------------
// Error handling — mocked localStorage
// ---------------------------------------------------------------------------

describe("storage adapter error handling", () => {
  test("getItem returns null when localStorage throws", () => {
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = () => {
      throw new Error("SecurityError");
    };
    try {
      expect(storage.getItem("any-key")).toBeNull();
    } finally {
      localStorage.getItem = originalGetItem;
    }
  });

  test("setItem does not throw when localStorage throws", () => {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error("SecurityError");
    };
    try {
      expect(() => storage.setItem("any-key", "value")).not.toThrow();
    } finally {
      localStorage.setItem = originalSetItem;
    }
  });

  test("setItem logs quota exceeded errors to console", () => {
    const proto = Object.getPrototypeOf(localStorage);
    const originalSetItem = proto.setItem;
    const originalConsoleError = console.error;
    const loggedMessages: string[] = [];
    console.error = (...args: unknown[]) => {
      loggedMessages.push(String(args[0]));
    };

    proto.setItem = () => {
      const err = Object.assign(new Error("Quota exceeded"), {
        name: "QuotaExceededError",
        code: 22,
      });
      throw err;
    };

    try {
      storage.setItem("big-key", "x".repeat(100));
      expect(loggedMessages.length).toBe(1);
      expect(loggedMessages[0]).toContain("[storage] Quota exceeded");
      expect(loggedMessages[0]).toContain("big-key");
    } finally {
      proto.setItem = originalSetItem;
      console.error = originalConsoleError;
    }
  });

  test("removeItem does not throw when localStorage throws", () => {
    const originalRemoveItem = localStorage.removeItem;
    localStorage.removeItem = () => {
      throw new Error("SecurityError");
    };
    try {
      expect(() => storage.removeItem("any-key")).not.toThrow();
    } finally {
      localStorage.removeItem = originalRemoveItem;
    }
  });
});

// ---------------------------------------------------------------------------
// StorageAdapter interface conformance
// ---------------------------------------------------------------------------

describe("StorageAdapter interface", () => {
  test("storage export satisfies the StorageAdapter interface", () => {
    const adapter: StorageAdapter = storage;
    expect(typeof adapter.getItem).toBe("function");
    expect(typeof adapter.setItem).toBe("function");
    expect(typeof adapter.removeItem).toBe("function");
  });
});
