import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { MonthSelector } from "@/pages/dashboard/MonthSelector";

const mockT = (key: string) => key;

test("MonthSelector shows label and helper text", () => {
  render(
    <MonthSelector
      value="2025-01"
      onChange={() => {}}
      options={["2025-01"]}
      currentMonthKey="2025-01"
      isCurrentMonth={true}
      t={mockT}
    />,
  );
  expect(screen.getByText("dashboard.viewMonth")).toBeInTheDocument();
  expect(
    screen.getByText(/dashboard\.currentMonthSummary/),
  ).toBeInTheDocument();
});
