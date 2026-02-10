import { test, expect, afterEach } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import { ExpensesByMonthList } from "@/pages/transactions/ExpensesByMonthList";
import type { Expense } from "@/lib/types";

afterEach(cleanup);

const mockT = (key: string, opts?: { count?: number }) =>
  opts?.count != null ? `${key}:${opts.count}` : key;

test("ExpensesByMonthList shows month header and expense when has one month and one expense", () => {
  const byMonth: [string, Expense[]][] = [
    [
      "2025-01",
      [
        {
          id: "e1",
          date: "2025-01-15",
          amount: 50,
          description: "Test purchase",
          category: "Food",
          source: "manual",
        },
      ],
    ],
  ];
  render(
    <ExpensesByMonthList
      byMonth={byMonth}
      defaultOpenMonth="2025-01"
      onExpenseTap={() => {}}
      t={mockT}
    />,
  );
  expect(screen.getAllByText("January 2025").length).toBeGreaterThan(0);
  expect(screen.getByText("Test purchase")).toBeInTheDocument();
  expect(screen.getAllByText("$50.00").length).toBeGreaterThan(0);
});

test("ExpensesByMonthList has tap target for each expense", () => {
  const byMonth: [string, Expense[]][] = [
    [
      "2025-01",
      [
        {
          id: "e1",
          date: "2025-01-15",
          amount: 50,
          description: "Test purchase",
          category: "Food",
          source: "manual",
        },
      ],
    ],
  ];
  render(
    <ExpensesByMonthList
      byMonth={byMonth}
      defaultOpenMonth="2025-01"
      onExpenseTap={() => {}}
      t={mockT}
    />,
  );
  const tapTarget = screen.getByRole("button", {
    name: /test purchase.*\$50\.00.*2025\/01\/15/i,
  });
  expect(tapTarget).toBeInTheDocument();
});
