import { beforeEach, expect, test } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BudgetProvider } from "@/context/BudgetContext";
import { PresetTransactionsProvider } from "@/context/PresetTransactionsContext";
import { GoogleAuthProviderFallback } from "@/context/GoogleAuthContext";
import { InvestmentsPage } from "@/pages/investments/InvestmentsPage";

const STORAGE_KEY = "budget-tool-data";

function TestWrapper() {
  return (
    <BudgetProvider>
      <PresetTransactionsProvider>
        <GoogleAuthProviderFallback>
          <MemoryRouter>
            <InvestmentsPage />
          </MemoryRouter>
        </GoogleAuthProviderFallback>
      </PresetTransactionsProvider>
    </BudgetProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      expenses: [],
      income: [],
      debts: [],
      debtPayments: [],
      cardSources: [],
      expenseCategories: [],
      incomeCategories: [],
      owners: [],
      investmentPortfolios: [],
    })
  );
});

test("InvestmentsPage renders empty state and creates a portfolio", async () => {
  render(<TestWrapper />);

  expect(screen.getByRole("heading", { name: "Investments" })).toBeInTheDocument();
  expect(screen.getByText("Create a portfolio to get started.")).toBeInTheDocument();

  fireEvent.change(screen.getByPlaceholderText("My portfolio"), {
    target: { value: "Retirement" },
  });
  fireEvent.click(screen.getByRole("button", { name: "New portfolio" }));

  await waitFor(() => {
    expect(screen.getByText("No holdings yet.")).toBeInTheDocument();
  });
});

