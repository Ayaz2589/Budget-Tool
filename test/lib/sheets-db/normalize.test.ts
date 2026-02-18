import { test, expect, describe } from "bun:test";
import {
  isValidDate,
  tryRepairDate,
  normalizeDate,
  looksLikeIsoDate,
  parseAmount,
  normalizeCategoryFromSheet,
  parseOwner,
  validateExpenseSource,
  hasIdColumn,
  findMissingHeaders,
} from "@/lib/sheets-db/normalize";

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

  test("returns NaN value as-is from number input", () => {
    expect(parseAmount(NaN)).toBe(null);
  });
});

describe("normalizeCategoryFromSheet", () => {
  test("returns trimmed category", () => {
    expect(normalizeCategoryFromSheet("Groceries")).toBe("Groceries");
    expect(normalizeCategoryFromSheet("  Food  ")).toBe("Food");
  });

  test("normalizes Uncategorized to empty string", () => {
    expect(normalizeCategoryFromSheet("Uncategorized")).toBe("");
    expect(normalizeCategoryFromSheet("uncategorized")).toBe("");
  });

  test("normalizes empty/blank to empty string", () => {
    expect(normalizeCategoryFromSheet("")).toBe("");
    expect(normalizeCategoryFromSheet("   ")).toBe("");
  });
});

describe("parseOwner", () => {
  test("returns trimmed string", () => {
    expect(parseOwner("Ayaz")).toBe("Ayaz");
    expect(parseOwner("  Tasnuva  ")).toBe("Tasnuva");
  });

  test("returns empty string for null/undefined", () => {
    expect(parseOwner(null)).toBe("");
    expect(parseOwner(undefined)).toBe("");
  });
});

describe("validateExpenseSource", () => {
  test("returns valid source for all known sources", () => {
    const validSources = [
      "amex", "amex-gold", "apple", "visa", "sapphire",
      "bank-of-america", "wells-fargo", "chase", "manual", "td",
    ];
    for (const source of validSources) {
      expect(validateExpenseSource(source)).toBe(source);
    }
  });

  test("handles uppercase input", () => {
    expect(validateExpenseSource("AMEX")).toBe("amex");
    expect(validateExpenseSource("Apple")).toBe("apple");
  });

  test("handles mixed case", () => {
    expect(validateExpenseSource("Amex-Gold")).toBe("amex-gold");
    expect(validateExpenseSource("Bank-Of-America")).toBe("bank-of-america");
  });

  test("trims whitespace", () => {
    expect(validateExpenseSource("  amex  ")).toBe("amex");
  });

  test("falls back to manual for unknown", () => {
    expect(validateExpenseSource("unknown")).toBe("manual");
    expect(validateExpenseSource("paypal")).toBe("manual");
    expect(validateExpenseSource("")).toBe("manual");
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

// T021: Write-side validation tests
describe("validateExpense", () => {
  // These will be imported after implementation
  let validateExpense: typeof import("@/lib/sheets-db/normalize").validateExpense;

  test("rejects expense with empty id", async () => {
    const mod = await import("@/lib/sheets-db/normalize");
    validateExpense = mod.validateExpense;
    expect(() =>
      validateExpense({ id: "", date: "2026-01-15", amount: 10, description: "Test", category: "Cat", source: "manual" }),
    ).toThrow(/Invalid/);
  });

  test("rejects expense with negative amount", async () => {
    const mod = await import("@/lib/sheets-db/normalize");
    validateExpense = mod.validateExpense;
    expect(() =>
      validateExpense({ id: "e1", date: "2026-01-15", amount: -5, description: "Test", category: "Cat", source: "manual" }),
    ).toThrow(/Invalid/);
  });

  test("rejects expense with invalid date", async () => {
    const mod = await import("@/lib/sheets-db/normalize");
    validateExpense = mod.validateExpense;
    expect(() =>
      validateExpense({ id: "e1", date: "not-a-date", amount: 10, description: "Test", category: "Cat", source: "manual" }),
    ).toThrow(/Invalid/);
  });

  test("accepts valid expense", async () => {
    const mod = await import("@/lib/sheets-db/normalize");
    validateExpense = mod.validateExpense;
    expect(() =>
      validateExpense({ id: "e1", date: "2026-01-15", amount: 10, description: "Test", category: "Cat", source: "manual" }),
    ).not.toThrow();
  });
});

describe("validateIncome", () => {
  test("rejects income with missing amount", async () => {
    const mod = await import("@/lib/sheets-db/normalize");
    expect(() =>
      mod.validateIncome({ id: "i1", date: "2026-01-15", amount: 0, description: "Test", category: "Cat" }),
    ).toThrow(/Invalid/);
  });

  test("accepts valid income", async () => {
    const mod = await import("@/lib/sheets-db/normalize");
    expect(() =>
      mod.validateIncome({ id: "i1", date: "2026-01-15", amount: 100, description: "Test", category: "Cat" }),
    ).not.toThrow();
  });
});

describe("validateDebt", () => {
  test("rejects debt with empty name", async () => {
    const mod = await import("@/lib/sheets-db/normalize");
    expect(() =>
      mod.validateDebt({ id: "d1", name: "", initialAmount: 100 }),
    ).toThrow(/Invalid/);
  });

  test("accepts valid debt", async () => {
    const mod = await import("@/lib/sheets-db/normalize");
    expect(() =>
      mod.validateDebt({ id: "d1", name: "Loan", initialAmount: 100 }),
    ).not.toThrow();
  });
});

describe("validateDebtPayment", () => {
  test("rejects payment with empty debtId", async () => {
    const mod = await import("@/lib/sheets-db/normalize");
    expect(() =>
      mod.validateDebtPayment({ id: "p1", debtId: "", date: "2026-01-15", amount: 50 }),
    ).toThrow(/Invalid/);
  });

  test("accepts valid payment", async () => {
    const mod = await import("@/lib/sheets-db/normalize");
    expect(() =>
      mod.validateDebtPayment({ id: "p1", debtId: "d1", date: "2026-01-15", amount: 50 }),
    ).not.toThrow();
  });
});

describe("validateOwnerTransfer", () => {
  test("rejects transfer where fromOwner === toOwner", async () => {
    const mod = await import("@/lib/sheets-db/normalize");
    expect(() =>
      mod.validateOwnerTransfer({ id: "t1", date: "2026-01-15", fromOwner: "Ayaz", toOwner: "Ayaz", amount: 100 }),
    ).toThrow(/Invalid/);
  });

  test("accepts valid transfer", async () => {
    const mod = await import("@/lib/sheets-db/normalize");
    expect(() =>
      mod.validateOwnerTransfer({ id: "t1", date: "2026-01-15", fromOwner: "Ayaz", toOwner: "Tasnuva", amount: 100 }),
    ).not.toThrow();
  });
});

describe("validatePresetTransaction", () => {
  test("rejects preset with empty id", async () => {
    const mod = await import("@/lib/sheets-db/normalize");
    expect(() =>
      mod.validatePresetTransaction({ id: "", source: "manual", description: "T", category: "C", owner: "O" }),
    ).toThrow(/Invalid/);
  });

  test("accepts valid preset", async () => {
    const mod = await import("@/lib/sheets-db/normalize");
    expect(() =>
      mod.validatePresetTransaction({ id: "p1", source: "manual", description: "T", category: "C", owner: "O" }),
    ).not.toThrow();
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
