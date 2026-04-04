import { afterEach, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DailySpendingHeatmap } from "@/pages/dashboard/widgets/DailySpendingHeatmap";
import type { DashboardDailySpending } from "@/types/dashboard";

afterEach(() => cleanup());

const FEB_DATA: DashboardDailySpending = {
  monthKey: "2026-02",
  days: Array.from({ length: 28 }, (_, i) => ({
    date: `2026-02-${String(i + 1).padStart(2, "0")}`,
    amount: i === 0 ? 100 : i === 14 ? 50 : 0,
  })),
  maxAmount: 100,
};

test("DailySpendingHeatmap renders day numbers", () => {
  render(<DailySpendingHeatmap dailySpending={FEB_DATA} size="lg" />);
  expect(screen.getByText("1")).toBeInTheDocument();
  expect(screen.getByText("15")).toBeInTheDocument();
  expect(screen.getByText("28")).toBeInTheDocument();
});

test("DailySpendingHeatmap shows empty state when no spending", () => {
  const empty: DashboardDailySpending = {
    monthKey: "2026-02",
    days: Array.from({ length: 28 }, (_, i) => ({
      date: `2026-02-${String(i + 1).padStart(2, "0")}`,
      amount: 0,
    })),
    maxAmount: 0,
  };
  render(<DailySpendingHeatmap dailySpending={empty} size="lg" />);
  expect(screen.getByText(/no.*spending|no.*data/i)).toBeInTheDocument();
});

test("DailySpendingHeatmap renders day header labels", () => {
  render(<DailySpendingHeatmap dailySpending={FEB_DATA} size="lg" />);
  expect(screen.getByText("Mon")).toBeInTheDocument();
  expect(screen.getByText("Sun")).toBeInTheDocument();
});

test("DailySpendingHeatmap renders legend", () => {
  render(<DailySpendingHeatmap dailySpending={FEB_DATA} size="lg" />);
  expect(screen.getByText("Less")).toBeInTheDocument();
  expect(screen.getByText("More")).toBeInTheDocument();
});
