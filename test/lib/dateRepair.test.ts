import { test, expect } from "bun:test";
import { isValidDate, tryRepairDate } from "@/lib/dateRepair";

test("isValidDate accepts YYYY-MM-DD", () => {
  expect(isValidDate("2025-01-15")).toBe(true);
  expect(isValidDate("2000-12-31")).toBe(true);
});

test("isValidDate rejects invalid formats", () => {
  expect(isValidDate("01/15/2025")).toBe(false);
  expect(isValidDate("2025-1-15")).toBe(false);
  expect(isValidDate("")).toBe(false);
  expect(isValidDate("not-a-date")).toBe(false);
});

test("tryRepairDate returns valid ISO date as-is", () => {
  expect(tryRepairDate("2025-01-15")).toBe("2025-01-15");
  expect(tryRepairDate("  2025-01-15  ")).toBe("2025-01-15");
});

test("tryRepairDate converts serial date to ISO", () => {
  // 44927 = 2023-01-01 in Google Sheets serial (days since 1899-12-30)
  const result = tryRepairDate("44927");
  expect(result).toBe("2023-01-01");
});

test("tryRepairDate repairs currency-looking value", () => {
  const result = tryRepairDate("$46,038");
  expect(result).not.toBeNull();
  expect(isValidDate(result!)).toBe(true);
});

test("tryRepairDate returns null for unparseable", () => {
  expect(tryRepairDate("abc")).toBeNull();
  expect(tryRepairDate("")).toBeNull();
});
