import { test, expect, describe } from "bun:test";
import {
  isValidDate,
  tryRepairDate,
  normalizeDate,
  looksLikeIsoDate,
  parseAmount,
  hasIdColumn,
  findMissingHeaders,
  generateId,
} from "@/lib/sheets-db/utils";

describe("isValidDate", () => {
  test("accepts valid ISO dates", () => {
    expect(isValidDate("2026-01-15")).toBe(true);
    expect(isValidDate("2025-12-31")).toBe(true);
  });

  test("rejects invalid formats", () => {
    expect(isValidDate("01-15-2026")).toBe(false);
    expect(isValidDate("2026/01/15")).toBe(false);
    expect(isValidDate("not-a-date")).toBe(false);
    expect(isValidDate("")).toBe(false);
  });
});

describe("tryRepairDate", () => {
  test("returns ISO date as-is", () => {
    expect(tryRepairDate("2026-01-15")).toBe("2026-01-15");
  });

  test("trims whitespace from ISO dates", () => {
    expect(tryRepairDate("  2026-01-15  ")).toBe("2026-01-15");
  });

  test("converts serial number to ISO date", () => {
    const result = tryRepairDate("46038");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("converts currency-formatted serial to ISO date", () => {
    const result = tryRepairDate("$46,038");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("returns null for unrepairable values", () => {
    expect(tryRepairDate("not-a-date")).toBe(null);
    expect(tryRepairDate("abc123")).toBe(null);
  });
});

describe("normalizeDate", () => {
  test("returns null for null/undefined", () => {
    expect(normalizeDate(null)).toBe(null);
    expect(normalizeDate(undefined)).toBe(null);
  });

  test("returns ISO date string directly", () => {
    expect(normalizeDate("2026-01-15")).toBe("2026-01-15");
  });

  test("repairs serial numbers", () => {
    const result = normalizeDate("46038");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("looksLikeIsoDate", () => {
  test("returns true for ISO dates", () => {
    expect(looksLikeIsoDate("2026-01-15")).toBe(true);
  });

  test("handles whitespace", () => {
    expect(looksLikeIsoDate("  2026-01-15  ")).toBe(true);
  });

  test("returns false for non-dates", () => {
    expect(looksLikeIsoDate("abc-123")).toBe(false);
    expect(looksLikeIsoDate("")).toBe(false);
  });
});

describe("parseAmount", () => {
  test("returns number directly", () => {
    expect(parseAmount(42.5)).toBe(42.5);
    expect(parseAmount(0)).toBe(0);
  });

  test("parses string numbers", () => {
    expect(parseAmount("42.5")).toBe(42.5);
    expect(parseAmount("$1,234.56")).toBe(1234.56);
  });

  test("strips currency and commas", () => {
    expect(parseAmount("$100")).toBe(100);
    expect(parseAmount("1,000")).toBe(1000);
  });

  test("returns null for non-numeric", () => {
    expect(parseAmount("abc")).toBe(null);
    expect(parseAmount("")).toBe(null);
    expect(parseAmount(null)).toBe(null);
    expect(parseAmount(undefined)).toBe(null);
  });

  test("returns null for NaN input", () => {
    expect(parseAmount(NaN)).toBe(null);
  });
});

describe("hasIdColumn", () => {
  const dateCheck = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

  test("returns true when first column is ID", () => {
    expect(hasIdColumn(["abc-123", "2026-01-15", "100", "Coffee"], 4, dateCheck)).toBe(true);
  });

  test("returns false when first column is date (legacy)", () => {
    expect(hasIdColumn(["2026-01-15", "100", "Coffee", "Other"], 4, dateCheck)).toBe(false);
  });

  test("returns false when row is shorter than minLength", () => {
    expect(hasIdColumn(["abc-123", "100"], 4, dateCheck)).toBe(false);
  });

  test("returns false when first column is empty", () => {
    expect(hasIdColumn(["", "2026-01-15", "100", "Coffee"], 4, dateCheck)).toBe(false);
  });
});

describe("findMissingHeaders", () => {
  test("returns empty when all required headers present", () => {
    expect(findMissingHeaders(["Date", "Amount"], ["date", "amount"])).toEqual([]);
  });

  test("returns missing header names", () => {
    expect(findMissingHeaders(["Date"], ["date", "amount"])).toEqual(["amount"]);
  });

  test("comparison is case-insensitive", () => {
    expect(findMissingHeaders(["DATE", "AMOUNT"], ["date", "amount"])).toEqual([]);
  });

  test("trims whitespace", () => {
    expect(findMissingHeaders(["  Date  ", "  Amount  "], ["date", "amount"])).toEqual([]);
  });

  test("returns all required when actual is empty", () => {
    expect(findMissingHeaders([], ["date", "amount"])).toEqual(["date", "amount"]);
  });
});

describe("generateId", () => {
  test("returns a non-empty string", () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(0);
  });

  test("generates unique IDs", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  test("contains timestamp prefix", () => {
    const id = generateId();
    expect(id).toContain("-");
    const parts = id.split("-");
    expect(Number(parts[0])).toBeGreaterThan(0);
  });
});
