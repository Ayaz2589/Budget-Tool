import { test, expect } from "bun:test";
import {
  getMonthLabel,
  computeMonthTotals,
  computeAllTotals,
  computeGrandTotals,
  type TotalsInput,
} from "@/lib/domain/totals";
import type { Expense, Income } from "@/lib/types";

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: "1",
    date: "2025-01-15",
    amount: 10,
    description: "X",
    category: "Other",
    source: "manual",
    ...overrides,
  };
}

function income(overrides: Partial<Income>): Income {
  return {
    id: "1",
    date: "2025-01-10",
    amount: 100,
    description: "Pay",
    category: "Paycheck",
    ...overrides,
  };
}

test("getMonthLabel formats month key", () => {
  expect(getMonthLabel("2025-01")).toBe("January 2025");
  expect(getMonthLabel("2024-12")).toBe("December 2024");
});

test("computeMonthTotals sums income and expenses for month", () => {
  const expenses: Expense[] = [
    expense({ date: "2025-02-01", amount: 20 }),
    expense({ date: "2025-02-15", amount: 30 }),
    expense({ date: "2025-03-01", amount: 5 }),
  ];
  const incomeList: Income[] = [
    income({ date: "2025-02-01", amount: 200 }),
  ];
  const result = computeMonthTotals("2025-02", expenses, incomeList, {}, []);
  expect(result.totalEarned).toBe(200);
  expect(result.totalSpent).toBe(50);
  expect(result.totalSaved).toBe(150);
  expect(result.monthLabel).toBe("February 2025");
});

test("computeAllTotals returns one entry per month", () => {
  const input: TotalsInput = {
    expenses: [
      expense({ date: "2025-01-01", amount: 10 }),
      expense({ date: "2025-02-01", amount: 20 }),
    ],
    income: [income({ date: "2025-01-01", amount: 100 })],
    ownerBalancesByMonth: {},
    owners: [],
  };
  const months = computeAllTotals(input);
  expect(months.length).toBe(2);
  const jan = months.find((m) => m.monthKey === "2025-01");
  expect(jan?.totalEarned).toBe(100);
  expect(jan?.totalSpent).toBe(10);
});

test("computeGrandTotals sums months", () => {
  const months = [
    { monthKey: "2025-01", totalEarned: 100, totalSpent: 50 } as any,
    { monthKey: "2025-02", totalEarned: 200, totalSpent: 80 } as any,
  ];
  const grand = computeGrandTotals(months);
  expect(grand.totalEarned).toBe(300);
  expect(grand.totalSpent).toBe(130);
});
