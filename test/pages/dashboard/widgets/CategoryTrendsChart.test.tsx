import { afterEach, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { CategoryTrendsChart } from "@/pages/dashboard/widgets/CategoryTrendsChart";
import type { DashboardCategoryTrends } from "@/types/dashboard";

afterEach(() => cleanup());

const TRENDS: DashboardCategoryTrends = {
  monthKeys: ["2026-01", "2026-02"],
  categories: ["Food", "Transport"],
  series: [
    { category: "Food", values: [100, 150] },
    { category: "Transport", values: [50, 30] },
  ],
};

test("CategoryTrendsChart renders category names in legend", () => {
  render(<CategoryTrendsChart categoryTrends={TRENDS} size="lg" />);
  expect(screen.getByText("Food")).toBeInTheDocument();
  expect(screen.getByText("Transport")).toBeInTheDocument();
});

test("CategoryTrendsChart shows empty state when no data", () => {
  const empty: DashboardCategoryTrends = {
    monthKeys: ["2026-01"],
    categories: [],
    series: [],
  };
  render(<CategoryTrendsChart categoryTrends={empty} size="lg" />);
  expect(screen.getByText(/no.*data|no.*trends/i)).toBeInTheDocument();
});
