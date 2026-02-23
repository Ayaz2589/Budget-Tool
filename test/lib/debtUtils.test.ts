import { test, expect } from "bun:test";
import { getDebtBalance } from "@/lib/domain/debtUtils";
import type { Debt, DebtPayment } from "@/lib/types";

function debt(overrides: Partial<Debt>): Debt {
  return {
    id: "d1",
    name: "Test",
    initialAmount: 1000,
    ...overrides,
  };
}

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
