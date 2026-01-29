import { test, expect } from "bun:test";
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

test("isSameExpense rejects different cardMember when both set", () => {
  const a = expense({ cardMember: "Ayaz" });
  const b = expense({ cardMember: "Tasnuva" });
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
