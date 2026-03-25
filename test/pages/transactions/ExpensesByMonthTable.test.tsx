import { test, expect, mock, afterEach } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ExpensesByMonthTable } from "@/pages/transactions/ExpensesByMonthTable";
import { SOURCE_LABEL_KEYS } from "@/lib/format/sourceLabels";
import type { TransactionLedgerRow } from "@/types/transactions";

afterEach(cleanup);

const mockT = (key: string, opts?: { count?: number }) =>
  opts?.count != null ? `${key}:${opts.count}` : key;

const sampleRow: TransactionLedgerRow = {
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
};

const sampleByMonth: [string, TransactionLedgerRow[]][] = [
  ["2025-01", [sampleRow]],
];

test("ExpensesByMonthTable shows Date and Category headers when has data", () => {
  const onRowTap = mock(() => {});
  render(
    <ExpensesByMonthTable
      byMonth={sampleByMonth}
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

test("ExpensesByMonthTable renders copy button and calls onCopy", () => {
  const onCopy = mock(() => {});
  render(
    <ExpensesByMonthTable
      byMonth={sampleByMonth}
      defaultOpenMonth="2025-01"
      sortBy="date"
      sortDir="desc"
      onSort={() => {}}
      onRowTap={() => {}}
      onCopy={onCopy}
      sourceLabelKeys={SOURCE_LABEL_KEYS}
      t={mockT}
    />,
  );
  const copyBtn = screen.getByRole("button", { name: /common\.copy/i });
  expect(copyBtn).toBeInTheDocument();
  fireEvent.click(copyBtn);
  expect(onCopy).toHaveBeenCalledWith(expect.objectContaining({ id: "e1" }));
});
