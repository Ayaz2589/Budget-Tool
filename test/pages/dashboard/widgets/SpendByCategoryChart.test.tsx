import { afterEach, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { SpendByCategoryChart } from "@/pages/dashboard/widgets/SpendByCategoryChart";
import type { DashboardParentCategorySlice } from "@/types/dashboard";

afterEach(() => cleanup());

const SLICES: DashboardParentCategorySlice[] = [
  { label: "Home", value: 2000 },
  { label: "Food", value: 500 },
  { label: "Transport", value: 200 },
];

test("SpendByCategoryChart renders category names", () => {
  render(<SpendByCategoryChart parentCategorySlices={SLICES} size="lg" />);
  expect(screen.getByText("Home")).toBeInTheDocument();
  expect(screen.getByText("Food")).toBeInTheDocument();
  expect(screen.getByText("Transport")).toBeInTheDocument();
});

test("SpendByCategoryChart shows empty state when no data", () => {
  render(<SpendByCategoryChart parentCategorySlices={[]} size="lg" />);
  expect(screen.getByText(/no.*data|no.*categories/i)).toBeInTheDocument();
});

test("SpendByCategoryChart renders amounts", () => {
  render(<SpendByCategoryChart parentCategorySlices={SLICES} size="lg" />);
  expect(screen.getByText("$2,000.00")).toBeInTheDocument();
  expect(screen.getByText("$500.00")).toBeInTheDocument();
});
