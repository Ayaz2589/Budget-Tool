import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { ExpensesByMonthTable } from "@/pages/transactions/ExpensesByMonthTable";
import { SOURCE_LABEL_KEYS } from "@/lib/sourceLabels";
import type { Expense } from "@/lib/types";

const mockT = (key: string, opts?: { count?: number }) =>
  opts?.count != null ? `${key}:${opts.count}` : key;

test("ExpensesByMonthTable shows Date and Category headers when has data", () => {
  const byMonth: [string, Expense[]][] = [
    [
      "2025-01",
      [
        {
          id: "e1",
          date: "2025-01-15",
          amount: 50,
          description: "Test",
          category: "My Purchase",
          source: "manual",
        },
      ],
    ],
  ];
  render(
    <ExpensesByMonthTable
      byMonth={byMonth}
      defaultOpenMonth="2025-01"
      sortBy="date"
      sortDir="desc"
      onSort={() => {}}
      onUpdateCategory={() => {}}
      onUpdateOwner={() => {}}
      onEdit={() => {}}
      expenseCategories={["My Purchase"]}
      ownerOptions={[]}
      onDeleteOne={() => {}}
      sourceLabelKeys={SOURCE_LABEL_KEYS}
      t={mockT}
    />,
  );
  expect(
    screen.getByRole("columnheader", { name: /common\.date/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("columnheader", { name: /common\.category/i }),
  ).toBeInTheDocument();
  expect(screen.getByText("Test")).toBeInTheDocument();
});
