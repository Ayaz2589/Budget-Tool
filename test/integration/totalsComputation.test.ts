import { test, expect, describe } from "bun:test";
import {
  computeAllTotals,
  computeGrandTotals,
  computeMonthTotals,
  type TotalsInput,
} from "@/lib/totals";
import type { Expense, Income } from "@/types/core";

/**
 * Integration test: Full totals computation pipeline
 *
 * Verifies financial correctness of month-by-month and grand totals
 * across multiple owners, allocation modes, and realistic numbers.
 */

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: "e-1",
    date: "2026-01-15",
    amount: 100,
    description: "Test expense",
    category: "Other",
    source: "manual",
    ...overrides,
  };
}

function income(overrides: Partial<Income>): Income {
  return {
    id: "i-1",
    date: "2026-01-01",
    amount: 5000,
    description: "Paycheck",
    category: "Paycheck",
    ...overrides,
  };
}

describe("Totals computation: Single month basics", () => {
  test("computes correct totals for single-month single-owner scenario", () => {
    const result = computeMonthTotals(
      "2026-01",
      [
        expense({ id: "e1", date: "2026-01-01", amount: 500 }),
        expense({ id: "e2", date: "2026-01-15", amount: 250.75 }),
        expense({ id: "e3", date: "2026-01-20", amount: 100.25 }),
      ],
      [
        income({ id: "i1", date: "2026-01-01", amount: 5000 }),
        income({ id: "i2", date: "2026-01-15", amount: 2000 }),
      ],
      {},
      []
    );

    expect(result.monthKey).toBe("2026-01");
    expect(result.monthLabel).toBe("January 2026");
    expect(result.totalEarned).toBe(7000);
    expect(result.totalSpent).toBe(851);
    expect(result.totalSaved).toBe(6149);
    // Savings rate: 6149 / 7000
    expect(result.personalSavingsRate).toBeCloseTo(6149 / 7000, 6);
  });

  test("excludes expenses from other months", () => {
    const result = computeMonthTotals(
      "2026-01",
      [
        expense({ id: "e1", date: "2026-01-10", amount: 200 }),
        expense({ id: "e2", date: "2026-02-10", amount: 500 }), // Different month
        expense({ id: "e3", date: "2025-12-10", amount: 300 }), // Different month
      ],
      [income({ id: "i1", date: "2026-01-01", amount: 3000 })],
      {},
      []
    );

    expect(result.totalSpent).toBe(200);
    expect(result.totalEarned).toBe(3000);
    expect(result.totalSaved).toBe(2800);
  });

  test("computes zero savings rate when no income", () => {
    const result = computeMonthTotals(
      "2026-01",
      [expense({ id: "e1", date: "2026-01-10", amount: 100 })],
      [],
      {},
      []
    );

    expect(result.totalEarned).toBe(0);
    expect(result.totalSpent).toBe(100);
    expect(result.totalSaved).toBe(-100);
    expect(result.personalSavingsRate).toBe(0); // safeDivide fallback
  });
});

describe("Totals computation: Multi-owner allocation", () => {
  const owners = ["Ayaz", "Tasnuva"];

  test("single owner allocation: full amount attributed to one owner", () => {
    const result = computeMonthTotals(
      "2026-01",
      [
        expense({
          id: "e1",
          date: "2026-01-10",
          amount: 300,
          paidByOwner: "Ayaz",
          allocationMode: "single",
        }),
      ],
      [],
      {},
      owners
    );

    expect(result.ownerSpending["Ayaz"]).toBe(300);
    expect(result.ownerSpending["Tasnuva"]).toBe(0);
    expect(result.sharedSpent).toBe(0);
  });

  test("equal split: amount divided equally between owners", () => {
    const result = computeMonthTotals(
      "2026-01",
      [
        expense({
          id: "e1",
          date: "2026-01-10",
          amount: 200,
          paidByOwner: "Ayaz",
          allocationMode: "equal",
        }),
      ],
      [],
      {},
      owners
    );

    expect(result.ownerSpending["Ayaz"]).toBe(100);
    expect(result.ownerSpending["Tasnuva"]).toBe(100);
    expect(result.sharedSpent).toBe(200);
    expect(result.sharedSplit["Ayaz"]).toBe(100);
    expect(result.sharedSplit["Tasnuva"]).toBe(100);
  });

  test("equal split among 3 owners handles rounding", () => {
    const threeOwners = ["Ayaz", "Tasnuva", "Sam"];
    const result = computeMonthTotals(
      "2026-01",
      [
        expense({
          id: "e1",
          date: "2026-01-10",
          amount: 100,
          paidByOwner: "Ayaz",
          allocationMode: "equal",
        }),
      ],
      [],
      {},
      threeOwners
    );

    // 100 / 3 = 33.33, 33.33, 33.34 (rounding safe)
    const totalOwnerSpending =
      (result.ownerSpending["Ayaz"] ?? 0) +
      (result.ownerSpending["Tasnuva"] ?? 0) +
      (result.ownerSpending["Sam"] ?? 0);
    expect(totalOwnerSpending).toBe(100);
    expect(result.sharedSpent).toBe(100);
  });

  test("custom allocation with percentages", () => {
    const result = computeMonthTotals(
      "2026-01",
      [
        expense({
          id: "e1",
          date: "2026-01-10",
          amount: 200,
          paidByOwner: "Ayaz",
          allocationMode: "custom",
          allocation: [
            { owner: "Ayaz", percent: 70 },
            { owner: "Tasnuva", percent: 30 },
          ],
        }),
      ],
      [],
      {},
      owners
    );

    expect(result.ownerSpending["Ayaz"]).toBe(140);
    expect(result.ownerSpending["Tasnuva"]).toBe(60);
    expect(result.sharedSpent).toBe(200);
  });

  test("custom allocation with fixed amounts", () => {
    const result = computeMonthTotals(
      "2026-01",
      [
        expense({
          id: "e1",
          date: "2026-01-10",
          amount: 150,
          paidByOwner: "Ayaz",
          allocationMode: "custom",
          allocation: [
            { owner: "Ayaz", amount: 100 },
            { owner: "Tasnuva", amount: 50 },
          ],
        }),
      ],
      [],
      {},
      owners
    );

    expect(result.ownerSpending["Ayaz"]).toBe(100);
    expect(result.ownerSpending["Tasnuva"]).toBe(50);
    expect(result.sharedSpent).toBe(150);
  });

  test("mixed allocation modes across multiple expenses", () => {
    const result = computeMonthTotals(
      "2026-01",
      [
        // Single owner expense
        expense({
          id: "e1",
          date: "2026-01-05",
          amount: 50,
          paidByOwner: "Ayaz",
          allocationMode: "single",
        }),
        // Equal split expense
        expense({
          id: "e2",
          date: "2026-01-10",
          amount: 100,
          paidByOwner: "Ayaz",
          allocationMode: "equal",
        }),
        // Custom split expense
        expense({
          id: "e3",
          date: "2026-01-15",
          amount: 200,
          paidByOwner: "Tasnuva",
          allocationMode: "custom",
          allocation: [
            { owner: "Ayaz", percent: 40 },
            { owner: "Tasnuva", percent: 60 },
          ],
        }),
      ],
      [income({ id: "i1", date: "2026-01-01", amount: 8000 })],
      {},
      owners
    );

    // Ayaz: 50 (single) + 50 (equal half) + 80 (40% of 200) = 180
    expect(result.ownerSpending["Ayaz"]).toBe(180);
    // Tasnuva: 0 (single) + 50 (equal half) + 120 (60% of 200) = 170
    expect(result.ownerSpending["Tasnuva"]).toBe(170);

    expect(result.totalSpent).toBe(350);
    expect(result.totalEarned).toBe(8000);
    expect(result.totalSaved).toBe(7650);

    // Shared = equal split (100) + custom split (200) = 300
    expect(result.sharedSpent).toBe(300);
  });
});

describe("Totals computation: Mortgage exclusion", () => {
  test("mortgage expenses excluded from totalSpentWithoutMortgage", () => {
    const result = computeMonthTotals(
      "2026-01",
      [
        expense({
          id: "e1",
          date: "2026-01-01",
          amount: 2500,
          category: "Mortgage",
          paidByOwner: "Ayaz",
        }),
        expense({
          id: "e2",
          date: "2026-01-15",
          amount: 300,
          category: "Groceries",
          paidByOwner: "Ayaz",
        }),
      ],
      [income({ id: "i1", date: "2026-01-01", amount: 7000 })],
      {},
      ["Ayaz"]
    );

    expect(result.totalSpent).toBe(2800);
    expect(result.totalSpentWithoutMortgage).toBe(300);
    // Mortgage is excluded from owner spending and shared calcs
    expect(result.ownerSpending["Ayaz"]).toBe(300);
  });
});

describe("Totals computation: computeAllTotals multi-month", () => {
  test("produces separate totals per month, sorted reverse chronologically", () => {
    const input: TotalsInput = {
      expenses: [
        expense({ id: "e1", date: "2026-01-10", amount: 500 }),
        expense({ id: "e2", date: "2026-01-20", amount: 300 }),
        expense({ id: "e3", date: "2026-02-05", amount: 400 }),
        expense({ id: "e4", date: "2026-03-15", amount: 600 }),
      ],
      income: [
        income({ id: "i1", date: "2026-01-01", amount: 5000 }),
        income({ id: "i2", date: "2026-02-01", amount: 5000 }),
        income({ id: "i3", date: "2026-03-01", amount: 5500 }),
      ],
      ownerBalancesByMonth: {},
      owners: [],
    };

    const months = computeAllTotals(input);

    expect(months.length).toBe(3);
    // Reverse chronological order
    expect(months[0]!.monthKey).toBe("2026-03");
    expect(months[1]!.monthKey).toBe("2026-02");
    expect(months[2]!.monthKey).toBe("2026-01");

    // January: 2 expenses summing to 800
    expect(months[2]!.totalSpent).toBe(800);
    expect(months[2]!.totalEarned).toBe(5000);
    expect(months[2]!.totalSaved).toBe(4200);

    // February
    expect(months[1]!.totalSpent).toBe(400);
    expect(months[1]!.totalEarned).toBe(5000);

    // March
    expect(months[0]!.totalSpent).toBe(600);
    expect(months[0]!.totalEarned).toBe(5500);
  });

  test("handles months with income only (no expenses)", () => {
    const input: TotalsInput = {
      expenses: [
        expense({ id: "e1", date: "2026-01-10", amount: 200 }),
      ],
      income: [
        income({ id: "i1", date: "2026-01-01", amount: 5000 }),
        income({ id: "i2", date: "2026-02-01", amount: 5000 }),
      ],
      ownerBalancesByMonth: {},
      owners: [],
    };

    const months = computeAllTotals(input);
    expect(months.length).toBe(2);

    const feb = months.find((m) => m.monthKey === "2026-02")!;
    expect(feb.totalEarned).toBe(5000);
    expect(feb.totalSpent).toBe(0);
    expect(feb.totalSaved).toBe(5000);
    expect(feb.personalSavingsRate).toBe(1);
  });

  test("handles months with expenses only (no income)", () => {
    const input: TotalsInput = {
      expenses: [
        expense({ id: "e1", date: "2026-01-10", amount: 200 }),
        expense({ id: "e2", date: "2026-02-10", amount: 300 }),
      ],
      income: [
        income({ id: "i1", date: "2026-01-01", amount: 5000 }),
      ],
      ownerBalancesByMonth: {},
      owners: [],
    };

    const months = computeAllTotals(input);
    const feb = months.find((m) => m.monthKey === "2026-02")!;
    expect(feb.totalEarned).toBe(0);
    expect(feb.totalSpent).toBe(300);
    expect(feb.totalSaved).toBe(-300);
    expect(feb.personalSavingsRate).toBe(0); // safeDivide fallback
  });

  test("owner spending tracked across months with allocations", () => {
    const owners = ["Ayaz", "Tasnuva"];
    const input: TotalsInput = {
      expenses: [
        expense({
          id: "e1",
          date: "2026-01-10",
          amount: 200,
          paidByOwner: "Ayaz",
          allocationMode: "equal",
        }),
        expense({
          id: "e2",
          date: "2026-02-10",
          amount: 300,
          paidByOwner: "Tasnuva",
          allocationMode: "equal",
        }),
      ],
      income: [
        income({ id: "i1", date: "2026-01-01", amount: 4000 }),
        income({ id: "i2", date: "2026-02-01", amount: 4000 }),
      ],
      ownerBalancesByMonth: {},
      owners,
    };

    const months = computeAllTotals(input);
    const jan = months.find((m) => m.monthKey === "2026-01")!;
    const feb = months.find((m) => m.monthKey === "2026-02")!;

    // Jan: 200 split equally
    expect(jan.ownerSpending["Ayaz"]).toBe(100);
    expect(jan.ownerSpending["Tasnuva"]).toBe(100);
    expect(jan.sharedSpent).toBe(200);

    // Feb: 300 split equally
    expect(feb.ownerSpending["Ayaz"]).toBe(150);
    expect(feb.ownerSpending["Tasnuva"]).toBe(150);
    expect(feb.sharedSpent).toBe(300);
  });
});

describe("Totals computation: computeGrandTotals", () => {
  test("sums all months correctly for realistic financial data", () => {
    const owners = ["Ayaz", "Tasnuva"];
    const input: TotalsInput = {
      expenses: [
        // January expenses
        expense({
          id: "e1",
          date: "2026-01-05",
          amount: 1200,
          category: "Mortgage",
          paidByOwner: "Ayaz",
        }),
        expense({
          id: "e2",
          date: "2026-01-10",
          amount: 450,
          category: "Groceries",
          paidByOwner: "Ayaz",
          allocationMode: "equal",
        }),
        expense({
          id: "e3",
          date: "2026-01-15",
          amount: 75,
          category: "Dining",
          paidByOwner: "Tasnuva",
        }),
        // February expenses
        expense({
          id: "e4",
          date: "2026-02-05",
          amount: 1200,
          category: "Mortgage",
          paidByOwner: "Ayaz",
        }),
        expense({
          id: "e5",
          date: "2026-02-12",
          amount: 380,
          category: "Groceries",
          paidByOwner: "Tasnuva",
          allocationMode: "equal",
        }),
        expense({
          id: "e6",
          date: "2026-02-20",
          amount: 150,
          category: "Shopping",
          paidByOwner: "Ayaz",
        }),
      ],
      income: [
        income({ id: "i1", date: "2026-01-01", amount: 5000, owner: "Ayaz" }),
        income({ id: "i2", date: "2026-01-01", amount: 4000, owner: "Tasnuva" }),
        income({ id: "i3", date: "2026-02-01", amount: 5000, owner: "Ayaz" }),
        income({ id: "i4", date: "2026-02-01", amount: 4000, owner: "Tasnuva" }),
      ],
      ownerBalancesByMonth: {},
      owners,
    };

    const months = computeAllTotals(input);
    const grand = computeGrandTotals(months);

    // Grand totals
    expect(grand.monthKey).toBe("TOTALS");
    expect(grand.monthLabel).toBe("TOTALS");

    // Total earned: (5000+4000) * 2 months = 18000
    expect(grand.totalEarned).toBe(18000);

    // Total spent: 1200 + 450 + 75 + 1200 + 380 + 150 = 3455
    expect(grand.totalSpent).toBe(3455);

    // Total saved: 18000 - 3455 = 14545
    expect(grand.totalSaved).toBe(14545);

    // Savings rate
    expect(grand.personalSavingsRate).toBeCloseTo(14545 / 18000, 6);

    // Total without mortgage: 3455 - 2400 = 1055
    expect(grand.totalSpentWithoutMortgage).toBe(1055);

    // Shared spent: 450 (equal) + 380 (equal) = 830
    expect(grand.sharedSpent).toBe(830);

    // Shared split: each gets half of 450 + half of 380
    expect(grand.sharedSplit["Ayaz"]).toBe(225 + 190);
    expect(grand.sharedSplit["Tasnuva"]).toBe(225 + 190);

    // Owner spending (non-mortgage):
    // Ayaz: 225 (half groceries Jan) + 190 (half groceries Feb) + 150 (shopping) = 565
    // Tasnuva: 225 (half groceries Jan) + 75 (dining) + 190 (half groceries Feb) = 490
    expect(grand.ownerSpending["Ayaz"]).toBe(565);
    expect(grand.ownerSpending["Tasnuva"]).toBe(490);

    // Verify owner spending sums to totalSpentWithoutMortgage
    const ownerSpendingSum =
      (grand.ownerSpending["Ayaz"] ?? 0) +
      (grand.ownerSpending["Tasnuva"] ?? 0);
    expect(ownerSpendingSum).toBe(grand.totalSpentWithoutMortgage);
  });

  test("grand totals with empty months list", () => {
    const grand = computeGrandTotals([]);

    expect(grand.totalEarned).toBe(0);
    expect(grand.totalSpent).toBe(0);
    expect(grand.totalSaved).toBe(0);
    expect(grand.personalSavingsRate).toBe(0);
  });

  test("grand totals with HYSA and investing", () => {
    const input: TotalsInput = {
      expenses: [
        expense({ id: "e1", date: "2026-01-10", amount: 200 }),
      ],
      income: [
        income({ id: "i1", date: "2026-01-01", amount: 5000 }),
        income({ id: "i2", date: "2026-02-01", amount: 5000 }),
      ],
      ownerBalancesByMonth: {},
      owners: [],
      hysaByMonth: { "2026-01": 1000, "2026-02": 1200 },
      investingByMonth: { "2026-01": 500, "2026-02": 600 },
    };

    const months = computeAllTotals(input);
    const grand = computeGrandTotals(months);

    expect(grand.hysa).toBe(2200);
    expect(grand.investingSp500).toBe(1100);
    expect(grand.investingTotal).toBe(3300); // hysa + investing per month summed
  });
});

describe("Totals computation: Edge cases", () => {
  test("empty expenses and income", () => {
    const input: TotalsInput = {
      expenses: [],
      income: [],
      ownerBalancesByMonth: {},
      owners: ["Ayaz"],
    };

    const months = computeAllTotals(input);
    expect(months.length).toBe(0);

    const grand = computeGrandTotals(months);
    expect(grand.totalEarned).toBe(0);
    expect(grand.totalSpent).toBe(0);
  });

  test("expenses with invalid dates are excluded", () => {
    const input: TotalsInput = {
      expenses: [
        expense({ id: "e1", date: "invalid", amount: 100 }),
        expense({ id: "e2", date: "2026-01-15", amount: 200 }),
      ],
      income: [],
      ownerBalancesByMonth: {},
      owners: [],
    };

    const months = computeAllTotals(input);
    // Only the valid expense generates a month
    expect(months.length).toBe(1);
    expect(months[0]!.totalSpent).toBe(200);
  });

  test("very small amounts are handled without floating point issues", () => {
    const result = computeMonthTotals(
      "2026-01",
      [
        expense({ id: "e1", date: "2026-01-01", amount: 0.01 }),
        expense({ id: "e2", date: "2026-01-02", amount: 0.02 }),
        expense({ id: "e3", date: "2026-01-03", amount: 0.03 }),
      ],
      [income({ id: "i1", date: "2026-01-01", amount: 1 })],
      {},
      []
    );

    expect(result.totalSpent).toBeCloseTo(0.06, 10);
    expect(result.totalEarned).toBe(1);
  });

  test("large realistic amounts compute correctly", () => {
    const result = computeMonthTotals(
      "2026-01",
      [
        expense({ id: "e1", date: "2026-01-01", amount: 25000 }),
        expense({ id: "e2", date: "2026-01-15", amount: 3500.50 }),
      ],
      [
        income({ id: "i1", date: "2026-01-01", amount: 150000 }),
      ],
      {},
      []
    );

    expect(result.totalSpent).toBe(28500.50);
    expect(result.totalEarned).toBe(150000);
    expect(result.totalSaved).toBe(121499.50);
  });
});
