import { test, expect, describe } from "bun:test";
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

// --- isValidDate edge cases ---

describe("isValidDate edge cases", () => {
  test("accepts leap year date Feb 29", () => {
    expect(isValidDate("2024-02-29")).toBe(true);
    expect(isValidDate("2000-02-29")).toBe(true);
  });

  test("accepts end-of-month boundaries", () => {
    expect(isValidDate("2025-01-31")).toBe(true);
    expect(isValidDate("2025-03-31")).toBe(true);
    expect(isValidDate("2025-04-30")).toBe(true);
    expect(isValidDate("2025-02-28")).toBe(true);
  });

  test("accepts first day of year", () => {
    expect(isValidDate("2025-01-01")).toBe(true);
  });

  test("accepts last day of year", () => {
    expect(isValidDate("2025-12-31")).toBe(true);
  });

  test("rejects date with extra characters", () => {
    expect(isValidDate("2025-01-15T00:00:00")).toBe(false);
    expect(isValidDate("2025-01-15 ")).toBe(false);
    expect(isValidDate(" 2025-01-15")).toBe(false);
  });

  test("rejects date with wrong separators", () => {
    expect(isValidDate("2025/01/15")).toBe(false);
    expect(isValidDate("2025.01.15")).toBe(false);
  });

  test("rejects single-digit month or day", () => {
    expect(isValidDate("2025-1-15")).toBe(false);
    expect(isValidDate("2025-01-5")).toBe(false);
  });

  test("accepts month 13 format (regex only, no calendar validation)", () => {
    // isValidDate only checks YYYY-MM-DD regex pattern, not calendar validity
    expect(isValidDate("2025-13-01")).toBe(true);
  });

  test("accepts month 00 format (regex only)", () => {
    expect(isValidDate("2025-00-15")).toBe(true);
  });

  test("accepts day 00 format (regex only)", () => {
    expect(isValidDate("2025-01-00")).toBe(true);
  });

  test("accepts day 32 format (regex only)", () => {
    expect(isValidDate("2025-01-32")).toBe(true);
  });

  test("accepts day 99 format (regex only)", () => {
    expect(isValidDate("2025-01-99")).toBe(true);
  });

  test("rejects pure number strings", () => {
    expect(isValidDate("20250115")).toBe(false);
  });
});

// --- tryRepairDate edge cases ---

describe("tryRepairDate edge cases", () => {
  test("repairs comma-separated serial number", () => {
    const result = tryRepairDate("44,927");
    expect(result).toBe("2023-01-01");
  });

  test("repairs serial with dollar sign and comma", () => {
    const result = tryRepairDate("$44,927");
    expect(result).toBe("2023-01-01");
  });

  test("repairs plain serial number", () => {
    // 45292 = 2024-01-01
    const result = tryRepairDate("45292");
    expect(result).toBe("2024-01-01");
  });

  test("returns null for negative serial number", () => {
    expect(tryRepairDate("-100")).toBeNull();
  });

  test("returns null for zero", () => {
    expect(tryRepairDate("0")).toBeNull();
  });

  test("returns null for extremely large number", () => {
    expect(tryRepairDate("1000000")).toBeNull();
  });

  test("returns null for number at boundary (999999 is valid)", () => {
    const result = tryRepairDate("999999");
    // 999999 is < 1000000 and > 0, so it should produce a date
    expect(result).not.toBeNull();
    expect(isValidDate(result!)).toBe(true);
  });

  test("handles whitespace around serial number", () => {
    const result = tryRepairDate("  44927  ");
    expect(result).toBe("2023-01-01");
  });

  test("returns null for non-numeric text", () => {
    expect(tryRepairDate("hello world")).toBeNull();
    expect(tryRepairDate("N/A")).toBeNull();
    expect(tryRepairDate("null")).toBeNull();
  });

  test("preserves already valid date with whitespace", () => {
    expect(tryRepairDate("  2026-03-15  ")).toBe("2026-03-15");
  });
});
