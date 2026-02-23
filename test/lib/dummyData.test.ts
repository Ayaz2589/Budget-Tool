import { expect, test } from "bun:test";
import { buildDummyBudget } from "@/lib/import/dummyData";

test("buildDummyBudget returns a compact deterministic dataset", () => {
  const data = buildDummyBudget("2026-02");

  expect(data.expenses).toHaveLength(9);
  expect(data.income).toHaveLength(5);
  expect(data.debts).toHaveLength(1);
  expect(data.debtPayments).toHaveLength(2);
  expect(data.ownerTransfers).toHaveLength(2);

  expect(data.expenses.some((row) => row.category === "Mortgage")).toBe(true);
  expect(data.debtPayments.some((row) => row.date.startsWith("2026-02"))).toBe(true);
  expect(data.ownerTransfers.some((row) => row.date.startsWith("2026-02"))).toBe(true);
});

