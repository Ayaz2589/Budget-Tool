import { test, expect, mock } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExpensesByMonthTable } from "@/pages/transactions/ExpensesByMonthTable";
import { SOURCE_LABEL_KEYS } from "@/lib/format/sourceLabels";
import type { TransactionLedgerRow } from "@/types/transactions";

const mockT = (key: string, opts?: { count?: number }) =>
  opts?.count != null ? `${key}:${opts.count}` : key;

test("ExpensesByMonthTable shows Date and Category headers when has data", () => {
  const onRowTap = mock(() => {});
  const byMonth: [string, TransactionLedgerRow[]][] = [
    [
      "2025-01",
      [
        {
          kind: "expense",
          id: "e1",
          date: "2025-01-15",
          amount: 50,
          description: "Test",
          category: "My Purchase",
          source: "manual",
          expense: {
            id: "e1",
            date: "2025-01-15",
            amount: 50,
            description: "Test",
            category: "My Purchase",
            source: "manual",
          },
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
      onRowTap={onRowTap}
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
  fireEvent.click(screen.getByRole("button", { name: /Test/i }));
  expect(onRowTap).toHaveBeenCalledWith(expect.objectContaining({ id: "e1" }));
});
