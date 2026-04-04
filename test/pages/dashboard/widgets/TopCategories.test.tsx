import { afterEach, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { TopCategories } from "@/pages/dashboard/widgets/TopCategories";
import type { DashboardCategorySlice } from "@/types/dashboard";

afterEach(() => cleanup());

const SLICES: DashboardCategorySlice[] = [
  { label: "Food > Groceries", value: 500 },
  { label: "Home > Rent/Mortgage", value: 2000 },
  { label: "Transport > Gas/Fuel", value: 200 },
  { label: "Food > Dining Out", value: 150 },
  { label: "Shopping > Clothing", value: 100 },
  { label: "Entertainment > Subscriptions", value: 80 },
  { label: "Health > Medical", value: 50 },
];

test("TopCategories renders at most 5 items", () => {
  render(<TopCategories categorySlices={SLICES} size="lg" />);
  // Should show top 5 (already sorted descending by selector)
  expect(screen.getByText("Home > Rent/Mortgage")).toBeInTheDocument();
  expect(screen.getByText("Food > Groceries")).toBeInTheDocument();
  expect(screen.getByText("Transport > Gas/Fuel")).toBeInTheDocument();
  expect(screen.getByText("Food > Dining Out")).toBeInTheDocument();
  expect(screen.getByText("Shopping > Clothing")).toBeInTheDocument();
  // 6th and 7th should not render
  expect(screen.queryByText("Entertainment > Subscriptions")).toBeNull();
  expect(screen.queryByText("Health > Medical")).toBeNull();
});

test("TopCategories shows empty state when no data", () => {
  render(<TopCategories categorySlices={[]} size="lg" />);
  expect(screen.getByText(/no.*data|no.*categories/i)).toBeInTheDocument();
});

test("TopCategories displays amounts", () => {
  render(<TopCategories categorySlices={SLICES.slice(0, 2)} size="lg" />);
  expect(screen.getByText("$2,000.00")).toBeInTheDocument();
  expect(screen.getByText("$500.00")).toBeInTheDocument();
});

test("TopCategories displays percentages", () => {
  // Total = 2500, Rent = 2000 = 80%, Groceries = 500 = 20%
  render(<TopCategories categorySlices={SLICES.slice(0, 2)} size="lg" />);
  expect(screen.getByText("80%")).toBeInTheDocument();
  expect(screen.getByText("20%")).toBeInTheDocument();
});
