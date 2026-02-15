import { test, expect, describe } from "bun:test";
import {
  isSameExpense,
  filterOutExistingExpenses,
} from "@/lib/importDedup";
import type { Expense } from "@/lib/types";

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: "1",
    date: "2025-01-15",
    amount: 10,
    description: "Test",
    category: "Other",
    source: "manual",
    ...overrides,
  };
}

test("isSameExpense matches on date and amount", () => {
  const a = expense({ date: "2025-01-15", amount: 10 });
  const b = expense({ id: "2", date: "2025-01-15", amount: 10 });
  expect(isSameExpense(a, b)).toBe(true);
});

test("isSameExpense allows amount within tolerance", () => {
  const a = expense({ amount: 10 });
  const b = expense({ amount: 10.005 });
  expect(isSameExpense(a, b)).toBe(true);
});

test("isSameExpense rejects different date", () => {
  const a = expense({ date: "2025-01-15" });
  const b = expense({ date: "2025-01-16" });
  expect(isSameExpense(a, b)).toBe(false);
});

test("isSameExpense rejects amount outside tolerance", () => {
  const a = expense({ amount: 10 });
  const b = expense({ amount: 10.02 });
  expect(isSameExpense(a, b)).toBe(false);
});

test("isSameExpense rejects different owner when both set", () => {
  const a = expense({ owner: "Ayaz" });
  const b = expense({ owner: "Tasnuva" });
  expect(isSameExpense(a, b)).toBe(false);
});

test("filterOutExistingExpenses removes duplicates", () => {
  const parsed = [
    expense({ id: "p1", date: "2025-01-15", amount: 5 }),
    expense({ id: "p2", date: "2025-01-16", amount: 7 }),
  ];
  const existing = [
    expense({ id: "e1", date: "2025-01-15", amount: 5 }),
  ];
  const result = filterOutExistingExpenses(parsed, existing);
  expect(result).toHaveLength(1);
  expect(result[0]!.date).toBe("2025-01-16");
});

// --- isSameExpense edge cases ---

test("isSameExpense matches when one owner is empty (wildcard)", () => {
  const a = expense({ owner: "Ayaz" });
  const b = expense({ owner: "" });
  expect(isSameExpense(a, b)).toBe(true);
});

test("isSameExpense matches when both owners are empty", () => {
  const a = expense({ owner: "" });
  const b = expense({ owner: undefined });
  expect(isSameExpense(a, b)).toBe(true);
});

test("isSameExpense matches same owner case-insensitively", () => {
  const a = expense({ owner: "AYAZ" });
  const b = expense({ owner: "ayaz" });
  expect(isSameExpense(a, b)).toBe(true);
});

test("isSameExpense matches owner with whitespace trimmed", () => {
  const a = expense({ owner: "  Ayaz  " });
  const b = expense({ owner: "Ayaz" });
  expect(isSameExpense(a, b)).toBe(true);
});

test("isSameExpense at 0.01 difference matches due to floating-point precision", () => {
  const a = expense({ amount: 10 });
  const b = expense({ amount: 10.01 });
  // In floating point, 10.01 - 10 = 0.00999... which is < 0.01 tolerance
  expect(isSameExpense(a, b)).toBe(true);
});

test("isSameExpense rejects 0.02 difference (well outside tolerance)", () => {
  const a = expense({ amount: 10 });
  const b = expense({ amount: 10.02 });
  expect(isSameExpense(a, b)).toBe(false);
});

test("isSameExpense just under tolerance (0.009 difference)", () => {
  const a = expense({ amount: 10 });
  const b = expense({ amount: 10.009 });
  expect(isSameExpense(a, b)).toBe(true);
});

// --- filterOutExistingExpenses edge cases ---

describe("filterOutExistingExpenses edge cases", () => {
  test("near-amount duplicates within 1 cent tolerance are filtered", () => {
    const parsed = [
      expense({ id: "p1", date: "2025-01-15", amount: 10.005 }),
    ];
    const existing = [
      expense({ id: "e1", date: "2025-01-15", amount: 10.01 }),
    ];
    const result = filterOutExistingExpenses(parsed, existing);
    // 10.005 rounds to 10.01 in cents: both round to 1001 or 1000
    // The index checks +/- 1 cent, so it should find a match
    expect(result).toHaveLength(0);
  });

  test("different owners are filtered when parsed has empty owner (wildcard)", () => {
    const parsed = [
      expense({ id: "p1", date: "2025-01-15", amount: 50, owner: "" }),
    ];
    const existing = [
      expense({ id: "e1", date: "2025-01-15", amount: 50, owner: "Ayaz" }),
    ];
    const result = filterOutExistingExpenses(parsed, existing);
    // Empty owner on parsed side is a wildcard, so it matches
    expect(result).toHaveLength(0);
  });

  test("different owners prevent match when both have owners", () => {
    const parsed = [
      expense({ id: "p1", date: "2025-01-15", amount: 50, owner: "Tasnuva" }),
    ];
    const existing = [
      expense({ id: "e1", date: "2025-01-15", amount: 50, owner: "Ayaz" }),
    ];
    const result = filterOutExistingExpenses(parsed, existing);
    expect(result).toHaveLength(1);
  });

  test("no duplicates: all parsed are new", () => {
    const parsed = [
      expense({ id: "p1", date: "2025-01-15", amount: 100 }),
      expense({ id: "p2", date: "2025-01-16", amount: 200 }),
      expense({ id: "p3", date: "2025-01-17", amount: 300 }),
    ];
    const existing = [
      expense({ id: "e1", date: "2025-02-01", amount: 999 }),
    ];
    const result = filterOutExistingExpenses(parsed, existing);
    expect(result).toHaveLength(3);
  });

  test("all parsed are duplicates: none remain", () => {
    const parsed = [
      expense({ id: "p1", date: "2025-01-15", amount: 10 }),
      expense({ id: "p2", date: "2025-01-16", amount: 20 }),
    ];
    const existing = [
      expense({ id: "e1", date: "2025-01-15", amount: 10 }),
      expense({ id: "e2", date: "2025-01-16", amount: 20 }),
    ];
    const result = filterOutExistingExpenses(parsed, existing);
    expect(result).toHaveLength(0);
  });

  test("empty parsed list returns empty", () => {
    const existing = [
      expense({ id: "e1", date: "2025-01-15", amount: 10 }),
    ];
    const result = filterOutExistingExpenses([], existing);
    expect(result).toHaveLength(0);
  });

  test("empty existing list returns all parsed", () => {
    const parsed = [
      expense({ id: "p1", date: "2025-01-15", amount: 10 }),
      expense({ id: "p2", date: "2025-01-16", amount: 20 }),
    ];
    const result = filterOutExistingExpenses(parsed, []);
    expect(result).toHaveLength(2);
  });

  test("both empty returns empty", () => {
    const result = filterOutExistingExpenses([], []);
    expect(result).toHaveLength(0);
  });

  test("multiple parsed expenses on same date with different amounts", () => {
    const parsed = [
      expense({ id: "p1", date: "2025-01-15", amount: 5.00 }),
      expense({ id: "p2", date: "2025-01-15", amount: 7.50 }),
      expense({ id: "p3", date: "2025-01-15", amount: 12.00 }),
    ];
    const existing = [
      expense({ id: "e1", date: "2025-01-15", amount: 7.50 }),
    ];
    const result = filterOutExistingExpenses(parsed, existing);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.amount).sort((a, b) => a - b)).toEqual([5, 12]);
  });

  test("existing owner is empty: acts as wildcard match against parsed with owner", () => {
    const parsed = [
      expense({ id: "p1", date: "2025-01-15", amount: 25, owner: "Tasnuva" }),
    ];
    const existing = [
      expense({ id: "e1", date: "2025-01-15", amount: 25, owner: "" }),
    ];
    const result = filterOutExistingExpenses(parsed, existing);
    // Existing empty owner is wildcard match
    expect(result).toHaveLength(0);
  });
});
