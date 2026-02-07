import { test, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { DebtPage } from "@/pages/debt/DebtPage";
import { BudgetProvider } from "@/context/BudgetContext";
import { PresetTransactionsProvider } from "@/context/PresetTransactionsContext";

const BUDGET_STORAGE_KEY = "budget-tool-data";

test("DebtPage shows remove payment confirmation dialog when Remove is clicked", () => {
  localStorage.clear();
  localStorage.setItem(
    BUDGET_STORAGE_KEY,
    JSON.stringify({
      expenses: [],
      income: [],
      debts: [
        {
          id: "d1",
          name: "Car loan",
          initialAmount: 10000,
          startDate: "2025-01-01",
          owner: "Ayaz",
        },
      ],
      debtPayments: [
        {
          id: "p1",
          debtId: "d1",
          date: "2025-01-15",
          amount: 500,
          note: "Monthly",
        },
      ],
    }),
  );

  render(
    <BudgetProvider>
      <PresetTransactionsProvider>
        <DebtPage />
      </PresetTransactionsProvider>
    </BudgetProvider>,
  );

  fireEvent.click(screen.getAllByRole("button", { name: /car loan/i })[0]!);
  const removeButton = screen.getByRole("button", { name: "Remove" });
  fireEvent.click(removeButton);

  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText("Remove this payment?")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Remove", hidden: false }),
  ).toBeInTheDocument();
});

test("DebtPage shows delete debt confirmation dialog when Delete debt is clicked", () => {
  localStorage.clear();
  localStorage.setItem(
    BUDGET_STORAGE_KEY,
    JSON.stringify({
      expenses: [],
      income: [],
      debts: [
        {
          id: "d1",
          name: "Car loan",
          initialAmount: 10000,
          startDate: "2025-01-01",
          owner: "Ayaz",
        },
      ],
      debtPayments: [],
    }),
  );

  render(
    <BudgetProvider>
      <PresetTransactionsProvider>
        <DebtPage />
      </PresetTransactionsProvider>
    </BudgetProvider>,
  );

  fireEvent.click(screen.getAllByRole("button", { name: /car loan/i })[0]!);
  const deleteDebtButton = screen.getByRole("button", { name: "Delete debt" });
  fireEvent.click(deleteDebtButton);

  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText("Delete debt?")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Delete debt", hidden: false }),
  ).toBeInTheDocument();
});

test("DebtPage opens add debt sheet from page action", () => {
  localStorage.clear();
  localStorage.setItem(
    BUDGET_STORAGE_KEY,
    JSON.stringify({
      expenses: [],
      income: [],
      debts: [],
      debtPayments: [],
    }),
  );

  render(
    <BudgetProvider>
      <PresetTransactionsProvider>
        <DebtPage />
      </PresetTransactionsProvider>
    </BudgetProvider>,
  );

  const addButtons = screen.getAllByRole("button", { name: /add debt/i });
  fireEvent.click(addButtons[0]!);
  expect(screen.getAllByText("New debt").length).toBeGreaterThan(0);
});
