import { beforeEach, expect, test } from "bun:test";
import { runStorageCleanupMigration } from "@/lib/storageCleanup";

beforeEach(() => {
  localStorage.clear();
});

test("runStorageCleanupMigration removes legacy keys and unsupported FX keys", () => {
  localStorage.setItem("budget-tool-data", "{}");
  localStorage.setItem("budget-tool-ui-format", "{}");
  localStorage.setItem("budget-tool-tour-completed", "1");
  localStorage.setItem("budget-tool-tour-seen-income", "1");
  localStorage.setItem("budget-tool-tour-seen-custom", "1");
  localStorage.setItem("budget-tool-dashboard-dummy", "1");
  localStorage.setItem("budget-tool-fx-usd-eur", '{"rate":0.92}');
  localStorage.setItem("budget-tool-fx-usd-abc", '{"rate":1.23}');
  localStorage.setItem("budget-tool-fx-usd-usd", '{"rate":1}');

  runStorageCleanupMigration();

  expect(localStorage.getItem("budget-tool-data")).toBe("{}");
  expect(localStorage.getItem("budget-tool-ui-format")).toBe("{}");
  expect(localStorage.getItem("budget-tool-tour-completed")).toBe("1");

  expect(localStorage.getItem("budget-tool-tour-seen-income")).toBeNull();
  expect(localStorage.getItem("budget-tool-tour-seen-custom")).toBeNull();
  expect(localStorage.getItem("budget-tool-dashboard-dummy")).toBeNull();
  expect(localStorage.getItem("budget-tool-fx-usd-abc")).toBeNull();
  expect(localStorage.getItem("budget-tool-fx-usd-usd")).toBeNull();
  expect(localStorage.getItem("budget-tool-fx-usd-eur")).toBe('{"rate":0.92}');
});

test("runStorageCleanupMigration is safe to call repeatedly", () => {
  localStorage.setItem("budget-tool-tour-seen-mortgage", "1");

  runStorageCleanupMigration();
  runStorageCleanupMigration();

  expect(localStorage.getItem("budget-tool-tour-seen-mortgage")).toBeNull();
});
