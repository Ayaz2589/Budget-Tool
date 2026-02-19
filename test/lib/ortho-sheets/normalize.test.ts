import { test, expect, describe } from "bun:test";

// Domain validation tests — moved from test/lib/sheets-db/normalize.test.ts

describe("normalizeCategoryFromSheet", () => {
  test("returns trimmed category", async () => {
    const { normalizeCategoryFromSheet } = await import("@/lib/ortho-sheets/normalize");
    expect(normalizeCategoryFromSheet("Groceries")).toBe("Groceries");
    expect(normalizeCategoryFromSheet("  Food  ")).toBe("Food");
  });

  test("normalizes Uncategorized to empty string", async () => {
    const { normalizeCategoryFromSheet } = await import("@/lib/ortho-sheets/normalize");
    expect(normalizeCategoryFromSheet("Uncategorized")).toBe("");
    expect(normalizeCategoryFromSheet("uncategorized")).toBe("");
  });

  test("normalizes empty/blank to empty string", async () => {
    const { normalizeCategoryFromSheet } = await import("@/lib/ortho-sheets/normalize");
    expect(normalizeCategoryFromSheet("")).toBe("");
    expect(normalizeCategoryFromSheet("   ")).toBe("");
  });
});

describe("parseOwner", () => {
  test("returns trimmed string", async () => {
    const { parseOwner } = await import("@/lib/ortho-sheets/normalize");
    expect(parseOwner("Ayaz")).toBe("Ayaz");
    expect(parseOwner("  Tasnuva  ")).toBe("Tasnuva");
  });

  test("returns empty string for null/undefined", async () => {
    const { parseOwner } = await import("@/lib/ortho-sheets/normalize");
    expect(parseOwner(null)).toBe("");
    expect(parseOwner(undefined)).toBe("");
  });
});

describe("validateExpenseSource", () => {
  test("returns valid source for all known sources", async () => {
    const { validateExpenseSource } = await import("@/lib/ortho-sheets/normalize");
    const validSources = [
      "amex", "amex-gold", "apple", "visa", "sapphire",
      "bank-of-america", "wells-fargo", "chase", "manual", "td",
    ];
    for (const source of validSources) {
      expect(validateExpenseSource(source)).toBe(source);
    }
  });

  test("handles uppercase input", async () => {
    const { validateExpenseSource } = await import("@/lib/ortho-sheets/normalize");
    expect(validateExpenseSource("AMEX")).toBe("amex");
  });

  test("falls back to manual for unknown", async () => {
    const { validateExpenseSource } = await import("@/lib/ortho-sheets/normalize");
    expect(validateExpenseSource("unknown")).toBe("manual");
    expect(validateExpenseSource("")).toBe("manual");
  });
});

describe("validateExpense", () => {
  test("rejects expense with empty id", async () => {
    const { validateExpense } = await import("@/lib/ortho-sheets/normalize");
    expect(() =>
      validateExpense({ id: "", date: "2026-01-15", amount: 10, description: "T", category: "C", source: "manual" }),
    ).toThrow(/Invalid/);
  });

  test("rejects expense with negative amount", async () => {
    const { validateExpense } = await import("@/lib/ortho-sheets/normalize");
    expect(() =>
      validateExpense({ id: "e1", date: "2026-01-15", amount: -5, description: "T", category: "C", source: "manual" }),
    ).toThrow(/Invalid/);
  });

  test("accepts valid expense", async () => {
    const { validateExpense } = await import("@/lib/ortho-sheets/normalize");
    expect(() =>
      validateExpense({ id: "e1", date: "2026-01-15", amount: 10, description: "T", category: "C", source: "manual" }),
    ).not.toThrow();
  });
});

describe("validateIncome", () => {
  test("rejects income with missing amount", async () => {
    const { validateIncome } = await import("@/lib/ortho-sheets/normalize");
    expect(() =>
      validateIncome({ id: "i1", date: "2026-01-15", amount: 0, description: "T", category: "C" }),
    ).toThrow(/Invalid/);
  });

  test("accepts valid income", async () => {
    const { validateIncome } = await import("@/lib/ortho-sheets/normalize");
    expect(() =>
      validateIncome({ id: "i1", date: "2026-01-15", amount: 100, description: "T", category: "C" }),
    ).not.toThrow();
  });
});

describe("validateDebt", () => {
  test("rejects debt with empty name", async () => {
    const { validateDebt } = await import("@/lib/ortho-sheets/normalize");
    expect(() =>
      validateDebt({ id: "d1", name: "", initialAmount: 100 }),
    ).toThrow(/Invalid/);
  });

  test("accepts valid debt", async () => {
    const { validateDebt } = await import("@/lib/ortho-sheets/normalize");
    expect(() =>
      validateDebt({ id: "d1", name: "Loan", initialAmount: 100 }),
    ).not.toThrow();
  });
});

describe("validateDebtPayment", () => {
  test("rejects payment with empty debtId", async () => {
    const { validateDebtPayment } = await import("@/lib/ortho-sheets/normalize");
    expect(() =>
      validateDebtPayment({ id: "p1", debtId: "", date: "2026-01-15", amount: 50 }),
    ).toThrow(/Invalid/);
  });

  test("accepts valid payment", async () => {
    const { validateDebtPayment } = await import("@/lib/ortho-sheets/normalize");
    expect(() =>
      validateDebtPayment({ id: "p1", debtId: "d1", date: "2026-01-15", amount: 50 }),
    ).not.toThrow();
  });
});

describe("validateOwnerTransfer", () => {
  test("rejects transfer where fromOwner === toOwner", async () => {
    const { validateOwnerTransfer } = await import("@/lib/ortho-sheets/normalize");
    expect(() =>
      validateOwnerTransfer({ id: "t1", date: "2026-01-15", fromOwner: "Ayaz", toOwner: "Ayaz", amount: 100 }),
    ).toThrow(/Invalid/);
  });

  test("accepts valid transfer", async () => {
    const { validateOwnerTransfer } = await import("@/lib/ortho-sheets/normalize");
    expect(() =>
      validateOwnerTransfer({ id: "t1", date: "2026-01-15", fromOwner: "Ayaz", toOwner: "Tasnuva", amount: 100 }),
    ).not.toThrow();
  });
});

describe("validatePresetTransaction", () => {
  test("rejects preset with empty id", async () => {
    const { validatePresetTransaction } = await import("@/lib/ortho-sheets/normalize");
    expect(() =>
      validatePresetTransaction({ id: "", source: "manual", description: "T", category: "C", owner: "O" }),
    ).toThrow(/Invalid/);
  });

  test("accepts valid preset", async () => {
    const { validatePresetTransaction } = await import("@/lib/ortho-sheets/normalize");
    expect(() =>
      validatePresetTransaction({ id: "p1", source: "manual", description: "T", category: "C", owner: "O" }),
    ).not.toThrow();
  });
});
