import { expect, test } from "bun:test";
import {
  buildParentCategoryBreakdown,
  buildCategoryTrends,
  buildCategoryComparison,
  buildDailySpending,
} from "@/pages/dashboard/dashboardSelectors";

// ---------------------------------------------------------------------------
// buildParentCategoryBreakdown
// ---------------------------------------------------------------------------

test("buildParentCategoryBreakdown groups subcategories by parent", () => {
  const result = buildParentCategoryBreakdown({
    expenses: [
      { id: "e1", date: "2026-02-01", amount: 50, description: "Groceries", category: "Food > Groceries", source: "manual" },
      { id: "e2", date: "2026-02-02", amount: 30, description: "Dinner", category: "Food > Dining Out", source: "manual" },
      { id: "e3", date: "2026-02-03", amount: 100, description: "Gas", category: "Transport > Gas/Fuel", source: "manual" },
    ],
    currentMonthKey: "2026-02",
    scope: "all",
  });

  expect(result).toHaveLength(2);
  expect(result[0]).toEqual({ label: "Transport", value: 100 });
  expect(result[1]).toEqual({ label: "Food", value: 80 });
});

test("buildParentCategoryBreakdown sorts by value descending", () => {
  const result = buildParentCategoryBreakdown({
    expenses: [
      { id: "e1", date: "2026-02-01", amount: 10, description: "Coffee", category: "Food > Coffee & Drinks", source: "manual" },
      { id: "e2", date: "2026-02-01", amount: 200, description: "Rent", category: "Home > Rent/Mortgage", source: "manual" },
      { id: "e3", date: "2026-02-01", amount: 50, description: "Gas", category: "Transport > Gas/Fuel", source: "manual" },
    ],
    currentMonthKey: "2026-02",
    scope: "all",
  });

  expect(result.map((r) => r.label)).toEqual(["Home", "Transport", "Food"]);
});

test("buildParentCategoryBreakdown returns empty array for no expenses", () => {
  const result = buildParentCategoryBreakdown({
    expenses: [],
    currentMonthKey: "2026-02",
    scope: "all",
  });
  expect(result).toEqual([]);
});

test("buildParentCategoryBreakdown handles uncategorized expenses", () => {
  const result = buildParentCategoryBreakdown({
    expenses: [
      { id: "e1", date: "2026-02-01", amount: 25, description: "Misc", category: "", source: "manual" },
      { id: "e2", date: "2026-02-01", amount: 50, description: "Groceries", category: "Food > Groceries", source: "manual" },
    ],
    currentMonthKey: "2026-02",
    scope: "all",
    uncategorizedLabel: "Uncategorized",
  });

  expect(result).toHaveLength(2);
  expect(result.find((r) => r.label === "Uncategorized")?.value).toBe(25);
  expect(result.find((r) => r.label === "Food")?.value).toBe(50);
});

test("buildParentCategoryBreakdown excludes mortgage when scope is exclude-mortgage", () => {
  const result = buildParentCategoryBreakdown({
    expenses: [
      { id: "e1", date: "2026-02-01", amount: 2000, description: "Mortgage", category: "Home > Rent/Mortgage", source: "manual" },
      { id: "e2", date: "2026-02-01", amount: 50, description: "Groceries", category: "Food > Groceries", source: "manual" },
    ],
    currentMonthKey: "2026-02",
    scope: "exclude-mortgage",
  });

  // Mortgage excluded, only Food remains
  expect(result).toEqual([{ label: "Food", value: 50 }]);
});

test("buildParentCategoryBreakdown handles flat (non-composite) categories", () => {
  const result = buildParentCategoryBreakdown({
    expenses: [
      { id: "e1", date: "2026-02-01", amount: 75, description: "Old format", category: "Groceries", source: "manual" },
    ],
    currentMonthKey: "2026-02",
    scope: "all",
  });

  // Flat category without " > " treated as its own label
  expect(result).toHaveLength(1);
  expect(result[0]!.label).toBe("Groceries");
  expect(result[0]!.value).toBe(75);
});

// ---------------------------------------------------------------------------
// buildCategoryTrends
// ---------------------------------------------------------------------------

test("buildCategoryTrends returns per-parent monthly totals", () => {
  const result = buildCategoryTrends({
    expenses: [
      { id: "e1", date: "2026-01-05", amount: 100, description: "Groceries", category: "Food > Groceries", source: "manual" },
      { id: "e2", date: "2026-01-10", amount: 50, description: "Gas", category: "Transport > Gas/Fuel", source: "manual" },
      { id: "e3", date: "2026-02-05", amount: 120, description: "Groceries", category: "Food > Groceries", source: "manual" },
      { id: "e4", date: "2026-02-08", amount: 30, description: "Dinner", category: "Food > Dining Out", source: "manual" },
    ],
    monthKeys: ["2026-01", "2026-02"],
    scope: "all",
  });

  expect(result.monthKeys).toEqual(["2026-01", "2026-02"]);
  expect(result.categories).toContain("Food");
  expect(result.categories).toContain("Transport");

  // Food: Jan=100, Feb=150
  const foodRow = result.series.find((s) => s.category === "Food");
  expect(foodRow?.values).toEqual([100, 150]);

  // Transport: Jan=50, Feb=0
  const transportRow = result.series.find((s) => s.category === "Transport");
  expect(transportRow?.values).toEqual([50, 0]);
});

test("buildCategoryTrends returns empty for no expenses", () => {
  const result = buildCategoryTrends({
    expenses: [],
    monthKeys: ["2026-01", "2026-02"],
    scope: "all",
  });

  expect(result.categories).toEqual([]);
  expect(result.series).toEqual([]);
});

test("buildCategoryTrends respects expense scope", () => {
  const result = buildCategoryTrends({
    expenses: [
      { id: "e1", date: "2026-02-01", amount: 2000, description: "Mortgage", category: "Home > Rent/Mortgage", source: "manual" },
      { id: "e2", date: "2026-02-01", amount: 50, description: "Groceries", category: "Food > Groceries", source: "manual" },
    ],
    monthKeys: ["2026-02"],
    scope: "exclude-mortgage",
  });

  expect(result.categories).toEqual(["Food"]);
  expect(result.series).toHaveLength(1);
});

test("buildCategoryTrends sorts categories by total spend descending", () => {
  const result = buildCategoryTrends({
    expenses: [
      { id: "e1", date: "2026-01-01", amount: 200, description: "Rent", category: "Home > Rent/Mortgage", source: "manual" },
      { id: "e2", date: "2026-01-01", amount: 50, description: "Groceries", category: "Food > Groceries", source: "manual" },
      { id: "e3", date: "2026-01-01", amount: 100, description: "Gas", category: "Transport > Gas/Fuel", source: "manual" },
    ],
    monthKeys: ["2026-01"],
    scope: "all",
  });

  expect(result.categories).toEqual(["Home", "Transport", "Food"]);
});

// ---------------------------------------------------------------------------
// buildCategoryComparison
// ---------------------------------------------------------------------------

test("buildCategoryComparison returns current vs previous month with % change", () => {
  const result = buildCategoryComparison({
    expenses: [
      { id: "e1", date: "2026-01-05", amount: 100, description: "Groceries", category: "Food > Groceries", source: "manual" },
      { id: "e2", date: "2026-02-05", amount: 120, description: "Groceries", category: "Food > Groceries", source: "manual" },
      { id: "e3", date: "2026-01-10", amount: 200, description: "Gas", category: "Transport > Gas/Fuel", source: "manual" },
      { id: "e4", date: "2026-02-10", amount: 150, description: "Gas", category: "Transport > Gas/Fuel", source: "manual" },
    ],
    currentMonthKey: "2026-02",
    scope: "all",
  });

  const food = result.find((r) => r.label === "Food");
  expect(food?.currentValue).toBe(120);
  expect(food?.previousValue).toBe(100);
  expect(food?.changePct).toBeCloseTo(0.2);
  expect(food?.direction).toBe("up");

  const transport = result.find((r) => r.label === "Transport");
  expect(transport?.currentValue).toBe(150);
  expect(transport?.previousValue).toBe(200);
  expect(transport?.changePct).toBeCloseTo(-0.25);
  expect(transport?.direction).toBe("down");
});

test("buildCategoryComparison returns null changePct for new category", () => {
  const result = buildCategoryComparison({
    expenses: [
      { id: "e1", date: "2026-02-01", amount: 50, description: "Coffee", category: "Food > Coffee & Drinks", source: "manual" },
    ],
    currentMonthKey: "2026-02",
    scope: "all",
  });

  expect(result).toHaveLength(1);
  expect(result[0]!.currentValue).toBe(50);
  expect(result[0]!.previousValue).toBe(0);
  expect(result[0]!.changePct).toBeNull();
  expect(result[0]!.direction).toBe("up");
});

test("buildCategoryComparison shows category only in previous month", () => {
  const result = buildCategoryComparison({
    expenses: [
      { id: "e1", date: "2026-01-01", amount: 80, description: "Gas", category: "Transport > Gas/Fuel", source: "manual" },
    ],
    currentMonthKey: "2026-02",
    scope: "all",
  });

  expect(result).toHaveLength(1);
  expect(result[0]!.currentValue).toBe(0);
  expect(result[0]!.previousValue).toBe(80);
  expect(result[0]!.changePct).toBeCloseTo(-1);
  expect(result[0]!.direction).toBe("down");
});

test("buildCategoryComparison direction is flat when no change", () => {
  const result = buildCategoryComparison({
    expenses: [
      { id: "e1", date: "2026-01-01", amount: 100, description: "Groceries", category: "Food > Groceries", source: "manual" },
      { id: "e2", date: "2026-02-01", amount: 100, description: "Groceries", category: "Food > Groceries", source: "manual" },
    ],
    currentMonthKey: "2026-02",
    scope: "all",
  });

  expect(result[0]!.changePct).toBe(0);
  expect(result[0]!.direction).toBe("flat");
});

test("buildCategoryComparison respects exclude-mortgage scope", () => {
  const result = buildCategoryComparison({
    expenses: [
      { id: "e1", date: "2026-02-01", amount: 2000, description: "Mortgage", category: "Home > Rent/Mortgage", source: "manual" },
      { id: "e2", date: "2026-02-01", amount: 50, description: "Groceries", category: "Food > Groceries", source: "manual" },
    ],
    currentMonthKey: "2026-02",
    scope: "exclude-mortgage",
  });

  expect(result).toHaveLength(1);
  expect(result[0]!.label).toBe("Food");
});

test("buildCategoryComparison groups composite keys by parent", () => {
  const result = buildCategoryComparison({
    expenses: [
      { id: "e1", date: "2026-02-01", amount: 50, description: "Groceries", category: "Food > Groceries", source: "manual" },
      { id: "e2", date: "2026-02-01", amount: 30, description: "Dinner", category: "Food > Dining Out", source: "manual" },
    ],
    currentMonthKey: "2026-02",
    scope: "all",
  });

  expect(result).toHaveLength(1);
  expect(result[0]!.label).toBe("Food");
  expect(result[0]!.currentValue).toBe(80);
});

test("buildCategoryComparison sorted by currentValue descending", () => {
  const result = buildCategoryComparison({
    expenses: [
      { id: "e1", date: "2026-02-01", amount: 50, description: "Groceries", category: "Food > Groceries", source: "manual" },
      { id: "e2", date: "2026-02-01", amount: 200, description: "Rent", category: "Home > Rent/Mortgage", source: "manual" },
    ],
    currentMonthKey: "2026-02",
    scope: "all",
  });

  expect(result[0]!.label).toBe("Home");
  expect(result[1]!.label).toBe("Food");
});

test("buildCategoryComparison returns empty for no expenses", () => {
  const result = buildCategoryComparison({
    expenses: [],
    currentMonthKey: "2026-02",
    scope: "all",
  });
  expect(result).toEqual([]);
});

// ---------------------------------------------------------------------------
// buildDailySpending
// ---------------------------------------------------------------------------

test("buildDailySpending aggregates expenses by day", () => {
  const result = buildDailySpending({
    expenses: [
      { id: "e1", date: "2026-02-01", amount: 50, description: "A", category: "Food", source: "manual" },
      { id: "e2", date: "2026-02-01", amount: 30, description: "B", category: "Food", source: "manual" },
      { id: "e3", date: "2026-02-15", amount: 100, description: "C", category: "Food", source: "manual" },
    ],
    monthKey: "2026-02",
    scope: "all",
  });

  expect(result.monthKey).toBe("2026-02");
  const day1 = result.days.find((d) => d.date === "2026-02-01");
  expect(day1?.amount).toBe(80);
  const day15 = result.days.find((d) => d.date === "2026-02-15");
  expect(day15?.amount).toBe(100);
  expect(result.maxAmount).toBe(100);
});

test("buildDailySpending includes all days of the month", () => {
  const result = buildDailySpending({
    expenses: [],
    monthKey: "2026-02",
    scope: "all",
  });

  // Feb 2026 has 28 days
  expect(result.days).toHaveLength(28);
  expect(result.days[0]!.date).toBe("2026-02-01");
  expect(result.days[27]!.date).toBe("2026-02-28");
  expect(result.days.every((d) => d.amount === 0)).toBe(true);
  expect(result.maxAmount).toBe(0);
});

test("buildDailySpending handles 31-day month", () => {
  const result = buildDailySpending({
    expenses: [],
    monthKey: "2026-03",
    scope: "all",
  });
  expect(result.days).toHaveLength(31);
});

test("buildDailySpending ignores expenses outside the month", () => {
  const result = buildDailySpending({
    expenses: [
      { id: "e1", date: "2026-01-15", amount: 200, description: "A", category: "Food", source: "manual" },
      { id: "e2", date: "2026-02-10", amount: 50, description: "B", category: "Food", source: "manual" },
    ],
    monthKey: "2026-02",
    scope: "all",
  });

  expect(result.maxAmount).toBe(50);
  const jan = result.days.find((d) => d.date === "2026-01-15");
  expect(jan).toBeUndefined();
});

test("buildDailySpending respects exclude-mortgage scope", () => {
  const result = buildDailySpending({
    expenses: [
      { id: "e1", date: "2026-02-01", amount: 2000, description: "Mortgage", category: "Home > Rent/Mortgage", source: "manual" },
      { id: "e2", date: "2026-02-01", amount: 50, description: "Food", category: "Food > Groceries", source: "manual" },
    ],
    monthKey: "2026-02",
    scope: "exclude-mortgage",
  });

  const day1 = result.days.find((d) => d.date === "2026-02-01");
  expect(day1?.amount).toBe(50);
  expect(result.maxAmount).toBe(50);
});
