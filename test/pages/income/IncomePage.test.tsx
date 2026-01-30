import { test, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { IncomePage } from "@/pages/income/IncomePage";
import { BudgetProvider } from "@/context/BudgetContext";
import { RulesProvider } from "@/context/RulesContext";
import { PresetTransactionsProvider } from "@/context/PresetTransactionsContext";

const BUDGET_STORAGE_KEY = "budget-tool-data";

test("IncomePage shows delete income confirmation dialog when delete is clicked", () => {
  localStorage.clear();
  localStorage.setItem(
    BUDGET_STORAGE_KEY,
    JSON.stringify({
      income: [
        {
          id: "i1",
          date: "2025-01-01",
          amount: 100,
          description: "Pay",
          category: "Rent",
          owner: "Ayaz",
        },
      ],
      expenses: [],
      debts: [],
      debtPayments: [],
    }),
  );

  render(
    <BudgetProvider>
      <RulesProvider>
        <PresetTransactionsProvider>
          <IncomePage />
        </PresetTransactionsProvider>
      </RulesProvider>
    </BudgetProvider>,
  );

  const deleteButton = screen.getByRole("button", { name: "Delete" });
  fireEvent.click(deleteButton);

  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText("Delete this income?")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Delete", hidden: false }),
  ).toBeInTheDocument();
});
