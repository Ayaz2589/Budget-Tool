import { test, expect } from "bun:test";
import { render, screen, within } from "@testing-library/react";
import { ExpenseActionsDialog } from "@/pages/transactions/ExpenseActionsDialog";

const mockT = (key: string) => key;

test("ExpenseActionsDialog shows description, amount, category select, and delete button when expense is set", () => {
  render(
    <ExpenseActionsDialog
      expense={{
        id: "e1",
        date: "2025-01-15",
        amount: 100,
        description: "Coffee",
        category: "Food",
        source: "manual",
      }}
      onClose={() => {}}
      onUpdateCategory={() => {}}
      onUpdateOwner={() => {}}
      onDelete={() => {}}
      expenseCategories={["Food", "Transport"]}
      ownerOptions={["Alex", "Sam"]}
      t={mockT}
    />,
  );
  const dialog = screen.getByRole("dialog");
  expect(dialog).toBeInTheDocument();
  const withinDialog = within(dialog);
  expect(withinDialog.getByText("Coffee")).toBeInTheDocument();
  expect(withinDialog.getByText("$100.00")).toBeInTheDocument();
  expect(withinDialog.getByText("2025-01-15")).toBeInTheDocument();
  expect(withinDialog.getByText("common.category")).toBeInTheDocument();
  expect(withinDialog.getByText("common.owner")).toBeInTheDocument();
  expect(withinDialog.getAllByRole("combobox")).toHaveLength(2);
  expect(
    withinDialog.getByRole("button", { name: /common\.delete/i }),
  ).toBeInTheDocument();
});
