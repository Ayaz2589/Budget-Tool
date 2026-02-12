import { expect, test } from "bun:test";
import {
  buildCategoryBreakdown,
  buildDashboardKpis,
  buildFixedObligations,
  buildOwnerSplit,
  getCurrentMonthKey,
  getRangeMonthKeys,
} from "@/pages/dashboard/dashboardSelectors";

test("buildDashboardKpis excludes mortgage when scope is exclude-mortgage", () => {
  const currentMonthKey = "2026-02";
  const kpis = buildDashboardKpis({
    currentMonthKey,
    scope: "exclude-mortgage",
    expenses: [
      {
        id: "e1",
        date: "2026-02-01",
        amount: 1000,
        description: "Mortgage",
        category: "Mortgage",
        source: "manual",
      },
      {
        id: "e2",
        date: "2026-02-05",
        amount: 200,
        description: "Groceries",
        category: "Food",
        source: "manual",
      },
      {
        id: "e3",
        date: "2026-01-05",
        amount: 300,
        description: "Groceries",
        category: "Food",
        source: "manual",
      },
    ],
    income: [
      {
        id: "i1",
        date: "2026-02-01",
        amount: 3000,
        description: "Salary",
        category: "Paycheck",
      },
    ],
    debts: [{ id: "d1", name: "Loan", initialAmount: 1000 }],
    debtPayments: [{ id: "p1", debtId: "d1", date: "2026-02-10", amount: 100 }],
  });

  expect(kpis.totalSpent).toBe(300);
  expect(kpis.netCashFlow).toBe(2700);
  expect(kpis.debtOutstanding).toBe(900);
});

test("buildCategoryBreakdown omits mortgage in exclude scope", () => {
  const slices = buildCategoryBreakdown({
    currentMonthKey: "2026-02",
    scope: "exclude-mortgage",
    expenses: [
      {
        id: "e1",
        date: "2026-02-01",
        amount: 1000,
        description: "Mortgage",
        category: "Mortgage",
        source: "manual",
      },
      {
        id: "e2",
        date: "2026-02-02",
        amount: 50,
        description: "Dinner",
        category: "Food",
        source: "manual",
      },
    ],
  });

  expect(slices).toEqual([{ label: "Food", value: 50 }]);
});

test("buildOwnerSplit handles 50/50 and unassigned buckets", () => {
  const slices = buildOwnerSplit({
    currentMonthKey: "2026-02",
    scope: "all",
    owners: ["Ayaz", "Tasnuva"],
    expenses: [
      {
        id: "e1",
        date: "2026-02-01",
        amount: 200,
        description: "Shared dinner",
        category: "50/50",
        source: "manual",
      },
      {
        id: "e2",
        date: "2026-02-02",
        amount: 40,
        description: "Misc",
        category: "Other",
        source: "manual",
      },
    ],
  });

  const ayaz = slices.find((slice) => slice.label === "Ayaz");
  const tasnuva = slices.find((slice) => slice.label === "Tasnuva");
  const shared = slices.find((slice) => slice.label === "Shared");
  expect(ayaz?.value).toBe(100);
  expect(tasnuva?.value).toBe(100);
  expect(shared?.value).toBe(240);
});

test("buildOwnerSplit honors equal split mode across owners", () => {
  const slices = buildOwnerSplit({
    currentMonthKey: "2026-02",
    scope: "all",
    owners: ["Ayaz", "Tasnuva"],
    expenses: [
      {
        id: "e1",
        date: "2026-02-01",
        amount: 655,
        description: "Water bill",
        category: "Utilities",
        source: "manual",
        paidByOwner: "Ayaz",
        allocationMode: "equal",
      },
    ],
  });

  const ayaz = slices.find((slice) => slice.label === "Ayaz");
  const tasnuva = slices.find((slice) => slice.label === "Tasnuva");
  expect(ayaz?.value).toBe(327.5);
  expect(tasnuva?.value).toBe(327.5);
});

test("buildOwnerSplit repairs equal split records with single explicit owner", () => {
  const slices = buildOwnerSplit({
    currentMonthKey: "2026-02",
    scope: "all",
    owners: ["Ayaz", "Tasnuva"],
    expenses: [
      {
        id: "e1",
        date: "2026-02-01",
        amount: 655,
        description: "Water bill",
        category: "Utilities",
        source: "manual",
        paidByOwner: "Ayaz",
        allocationMode: "equal",
        allocation: [{ owner: "Ayaz", percent: 100 }],
      },
    ],
  });

  const ayaz = slices.find((slice) => slice.label === "Ayaz");
  const tasnuva = slices.find((slice) => slice.label === "Tasnuva");
  expect(ayaz?.value).toBe(327.5);
  expect(tasnuva?.value).toBe(327.5);
});

test("buildFixedObligations includes mortgage, utilities, and debt payments", () => {
  const value = buildFixedObligations({
    currentMonthKey: "2026-02",
    expenses: [
      {
        id: "e1",
        date: "2026-02-01",
        amount: 1000,
        description: "Mortgage",
        category: "Mortgage",
        source: "manual",
      },
      {
        id: "e2",
        date: "2026-02-02",
        amount: 100,
        description: "Utilities",
        category: "Utilities",
        source: "manual",
      },
      {
        id: "e3",
        date: "2026-02-03",
        amount: 20,
        description: "Coffee",
        category: "Food",
        source: "manual",
      },
    ],
    debtPayments: [{ id: "p1", debtId: "d1", date: "2026-02-05", amount: 80 }],
  });

  expect(value).toBe(1180);
});

test("range helper supports current, 6 and 12 windows", () => {
  const current = getCurrentMonthKey();
  expect(getRangeMonthKeys("current", current)).toHaveLength(1);
  expect(getRangeMonthKeys("6", current)).toHaveLength(6);
  expect(getRangeMonthKeys("12", current)).toHaveLength(12);
});
