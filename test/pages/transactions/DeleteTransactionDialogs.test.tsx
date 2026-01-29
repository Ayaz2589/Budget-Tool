import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import {
  DeleteOneTransactionDialog,
  DeleteSelectedTransactionsDialog,
  DeleteAllTransactionsDialog,
} from "@/pages/transactions/DeleteTransactionDialogs";

const mockT = (key: string, opts?: Record<string, string | number>) =>
  opts ? `${key}:${JSON.stringify(opts)}` : key;

test("DeleteOneTransactionDialog shows title when open with expense", () => {
  render(
    <DeleteOneTransactionDialog
      expense={{
        id: "e1",
        date: "2025-01-15",
        amount: 100,
        description: "Coffee",
        category: "Food",
        source: "manual",
      }}
      onClose={() => {}}
      onConfirm={() => {}}
      t={mockT}
    />,
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText("transactions.deleteThisTitle")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /common\.delete/i }),
  ).toBeInTheDocument();
});

test("DeleteSelectedTransactionsDialog shows title when open", () => {
  render(
    <DeleteSelectedTransactionsDialog
      open={true}
      onOpenChange={() => {}}
      count={3}
      onConfirm={() => {}}
      t={(k, opts) => (opts?.count != null ? `${k}:${opts.count}` : k)}
    />,
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(
    screen.getByText("transactions.deleteSelectedTitle"),
  ).toBeInTheDocument();
});

test("DeleteAllTransactionsDialog shows title when open", () => {
  render(
    <DeleteAllTransactionsDialog
      open={true}
      onOpenChange={() => {}}
      count={10}
      onConfirm={() => {}}
      t={(k, opts) => (opts?.count != null ? `${k}:${opts.count}` : k)}
    />,
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText("transactions.deleteAllTitle")).toBeInTheDocument();
});
