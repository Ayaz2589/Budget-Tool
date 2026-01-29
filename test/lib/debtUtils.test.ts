import { test, expect } from "bun:test";
import { countRecurringDeductions, getDebtBalance } from "@/lib/debtUtils";
import type { Debt, DebtPayment } from "@/lib/types";

function debt(overrides: Partial<Debt>): Debt {
  return {
    id: "d1",
    name: "Test",
    initialAmount: 1000,
    ...overrides,
  };
}

test("countRecurringDeductions returns 0 when no recurring amount", () => {
  expect(countRecurringDeductions(debt({ recurringAmount: 0 }))).toBe(0);
  expect(
    countRecurringDeductions(debt({}), new Date("2025-06-15")),
  ).toBe(0);
});

test("countRecurringDeductions monthly: one month by asOfDate", () => {
  const d = debt({
    startDate: "2025-01-01",
    recurringAmount: 100,
    recurringFrequency: "monthly",
    recurringDayOfMonth: 15,
  });
  const asOf = new Date("2025-02-20");
  expect(countRecurringDeductions(d, asOf)).toBe(2);
});

test("countRecurringDeductions biweekly: fixed asOfDate", () => {
  const d = debt({
    startDate: "2025-01-01",
    recurringAmount: 50,
    recurringFrequency: "biweekly",
    recurringStartDate: "2025-01-01",
  });
  const asOf = new Date("2025-01-20");
  const count = countRecurringDeductions(d, asOf);
  expect(count).toBeGreaterThanOrEqual(1);
});

test("getDebtBalance subtracts payments", () => {
  const d = debt({ id: "d1", initialAmount: 1000 });
  const payments: DebtPayment[] = [
    { id: "p1", debtId: "d1", date: "2025-01-01", amount: 300 },
    { id: "p2", debtId: "d1", date: "2025-02-01", amount: 200 },
  ];
  expect(getDebtBalance(d, payments)).toBe(500);
});

test("getDebtBalance ignores payments for other debts", () => {
  const d = debt({ id: "d1", initialAmount: 1000 });
  const payments: DebtPayment[] = [
    { id: "p1", debtId: "d2", date: "2025-01-01", amount: 300 },
  ];
  expect(getDebtBalance(d, payments)).toBe(1000);
});

test("getDebtBalance returns 0 when overpaid", () => {
  const d = debt({ id: "d1", initialAmount: 100 });
  const payments: DebtPayment[] = [
    { id: "p1", debtId: "d1", date: "2025-01-01", amount: 150 },
  ];
  expect(getDebtBalance(d, payments)).toBe(0);
});
