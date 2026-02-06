import { test, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { TransactionsToolbar } from "@/pages/transactions/TransactionsToolbar";

const mockT = (key: string) => key;

test("TransactionsToolbar shows Filters and Add buttons", () => {
  render(
    <TransactionsToolbar
      onOpenFilters={() => {}}
      onAddTransaction={() => {}}
      hasActiveFilters={false}
      t={mockT}
    />,
  );
  expect(
    screen.getByRole("button", { name: /common\.filtersAndActions/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /add expense/i }),
  ).toBeInTheDocument();
});
