import { afterEach, test, expect } from "bun:test";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DebtPage } from "@/pages/debt/DebtPage";
import { BudgetProvider } from "@/context";
import { PresetTransactionsProvider } from "@/context";

const BUDGET_STORAGE_KEY = "budget-tool-data";

afterEach(() => {
  cleanup();
});

function renderDebtPage(initialEntry = "/dashboard/debt") {
  return render(
    <BudgetProvider>
      <PresetTransactionsProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/dashboard/debt" element={<DebtPage />} />
          </Routes>
        </MemoryRouter>
      </PresetTransactionsProvider>
    </BudgetProvider>,
  );
}

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

  renderDebtPage();

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

  renderDebtPage();

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

  renderDebtPage();

  const addButtons = screen.getAllByRole("button", { name: /add debt/i });
  fireEvent.click(addButtons[0]!);
  expect(screen.getAllByText("New debt").length).toBeGreaterThan(0);
});

test("DebtPage opens debt actions from debtId query param", () => {
  localStorage.clear();
  localStorage.setItem(
    BUDGET_STORAGE_KEY,
    JSON.stringify({
      expenses: [],
      income: [],
      debts: [
        {
          id: "d-query",
          name: "Student loan",
          initialAmount: 12000,
          startDate: "2025-01-01",
        },
      ],
      debtPayments: [],
    }),
  );
  renderDebtPage("/dashboard/debt?debtId=d-query");

  expect(screen.getAllByText("Student loan").length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: "Delete debt" })).toBeInTheDocument();
});
