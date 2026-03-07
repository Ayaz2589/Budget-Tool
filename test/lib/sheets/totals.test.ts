import { test, expect, describe } from "bun:test";
import { buildTotalsValues } from "@/lib/sheets/totals";
import type { MonthTotals } from "@/types/totals";

function makeMonthTotals(overrides: Partial<MonthTotals> = {}): MonthTotals {
  return {
    monthKey: "2026-01",
    monthLabel: "January 2026",
    totalEarned: 5000,
    totalSpent: 3000,
    totalSpentWithoutMortgage: 1500,
    sharedSpent: 800,
    sharedSplit: { Alice: 400, Bob: 400 },
    ownerSpending: { Alice: 1200, Bob: 1800 },
    ownerBalances: { Alice: 300, Bob: -300 },
    totalSaved: 2000,
    personalSavingsRate: 0.4,
    hysa: 10000,
    investingSp500: 5000,
    investingTotal: 8000,
    ...overrides,
  };
}

describe("buildTotalsValues", () => {
  test("header row includes all expected columns", () => {
    const grandTotal = makeMonthTotals({ monthLabel: "Grand Total" });
    const rows = buildTotalsValues([], grandTotal);
    const header = rows[0] as string[];

    expect(header).toContain("Month");
    expect(header).toContain("Total Earned");
    expect(header).toContain("Total Spent");
    expect(header).toContain("Total Spent w/o Mortgage");
    expect(header).toContain("Shared Spent");
    expect(header).toContain("Alice's Spending");
    expect(header).toContain("Bob's Spending");
    expect(header).toContain("Alice's Balance");
    expect(header).toContain("Bob's Balance");
    expect(header).toContain("Total Saved");
    expect(header).toContain("Personal Savings Rate");
    expect(header).toContain("HYSA");
    expect(header).toContain("Investing (S&P 500)");
    expect(header).toContain("Investing Total");
  });

  test("data rows match month data", () => {
    const jan = makeMonthTotals({
      monthLabel: "January 2026",
      totalEarned: 5000,
      totalSpent: 3000,
    });
    const feb = makeMonthTotals({
      monthKey: "2026-02",
      monthLabel: "February 2026",
      totalEarned: 6000,
      totalSpent: 2500,
    });
    const grandTotal = makeMonthTotals({
      monthLabel: "Grand Total",
      totalEarned: 11000,
      totalSpent: 5500,
    });

    const rows = buildTotalsValues([jan, feb], grandTotal);

    // Row 0 = header, Row 1 = Jan, Row 2 = Feb, Row 3 = grand total
    expect(rows.length).toBe(4);

    const janRow = rows[1] as unknown[];
    expect(janRow[0]).toBe("January 2026");
    expect(janRow[1]).toBe(5000);
    expect(janRow[2]).toBe(3000);

    const febRow = rows[2] as unknown[];
    expect(febRow[0]).toBe("February 2026");
    expect(febRow[1]).toBe(6000);
    expect(febRow[2]).toBe(2500);
  });

  test("grand total is the last row", () => {
    const jan = makeMonthTotals({ monthLabel: "January 2026" });
    const grandTotal = makeMonthTotals({
      monthLabel: "Grand Total",
      totalEarned: 11000,
    });

    const rows = buildTotalsValues([jan], grandTotal);
    const lastRow = rows[rows.length - 1] as unknown[];

    expect(lastRow[0]).toBe("Grand Total");
    expect(lastRow[1]).toBe(11000);
  });

  test("owner columns are sorted alphabetically", () => {
    const grandTotal = makeMonthTotals({
      monthLabel: "Grand Total",
      ownerSpending: { Zara: 500, Alice: 1200, Mike: 800 },
      ownerBalances: { Zara: -100, Alice: 300, Mike: -200 },
    });

    const rows = buildTotalsValues([], grandTotal);
    const header = rows[0] as string[];

    const spendingCols = header.filter((h) => h.endsWith("'s Spending"));
    expect(spendingCols).toEqual([
      "Alice's Spending",
      "Mike's Spending",
      "Zara's Spending",
    ]);

    const balanceCols = header.filter((h) => h.endsWith("'s Balance"));
    expect(balanceCols).toEqual([
      "Alice's Balance",
      "Mike's Balance",
      "Zara's Balance",
    ]);

    // Verify data row values also follow alphabetical order
    const dataRow = rows[1] as unknown[];
    const sharedSpentIdx = header.indexOf("Shared Spent");
    // After Shared Spent come owner spending columns, then owner balance columns
    expect(dataRow[sharedSpentIdx + 1]).toBe(1200); // Alice's Spending
    expect(dataRow[sharedSpentIdx + 2]).toBe(800);  // Mike's Spending
    expect(dataRow[sharedSpentIdx + 3]).toBe(500);  // Zara's Spending
  });
});
