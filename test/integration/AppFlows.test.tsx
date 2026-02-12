import { beforeEach, expect, test } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  BudgetProvider,
  GoogleAuthProviderFallback,
  PresetTransactionsProvider,
} from "@/context";
import { Layout } from "@/components";
import { IncomePage } from "@/pages/income";
import { TransactionsPage } from "@/pages/transactions";

const STORAGE_KEY = "budget-tool-data";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      expenses: [
        {
          id: "expense-1",
          date: "2026-02-10",
          amount: 50,
          description: "Weekly groceries",
          category: "Food",
          source: "manual",
        },
        {
          id: "expense-2",
          date: "2026-02-11",
          amount: 40,
          description: "Gas station",
          category: "Transport",
          source: "td",
        },
      ],
      income: [
        {
          id: "income-1",
          date: "2026-02-01",
          amount: 3000,
          description: "Paycheck",
          category: "Paycheck",
          source: "manual",
        },
      ],
      debts: [],
      debtPayments: [],
      ownerTransfers: [],
      iOweNova: {},
      cardSources: ["manual", "td"],
      expenseCategories: ["Food", "Transport"],
      incomeCategories: ["Paycheck"],
      owners: [],
    }),
  );
});

function renderApp(initialRoute = "/dashboard/transactions") {
  return render(
    <BudgetProvider>
      <PresetTransactionsProvider>
        <GoogleAuthProviderFallback>
          <MemoryRouter initialEntries={[initialRoute]}>
            <Routes>
              <Route path="/dashboard" element={<Layout />}>
                <Route path="transactions" element={<TransactionsPage />} />
                <Route path="income" element={<IncomePage />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </GoogleAuthProviderFallback>
      </PresetTransactionsProvider>
    </BudgetProvider>,
  );
}

test("integration: user can search transactions and navigate between pages", async () => {
  renderApp();

  fireEvent.change(screen.getAllByLabelText("Search description")[0]!, {
    target: { value: "weekly" },
  });

  expect(screen.getAllByText("Weekly groceries").length).toBeGreaterThan(0);
  expect(screen.queryByText("Gas station")).toBeNull();

  const incomeLink = screen
    .getAllByRole("link", { name: /^Income$/i })
    .find((link) => link.getAttribute("href") === "/dashboard/income");
  expect(incomeLink).toBeTruthy();
  fireEvent.click(incomeLink as HTMLAnchorElement);

  await waitFor(() => {
    expect(
      screen.getAllByRole("heading", { name: "Income" }).length,
    ).toBeGreaterThan(0);
  });

  const transactionsLink = screen
    .getAllByRole("link", { name: /^Transactions$/i })
    .find((link) => link.getAttribute("href") === "/dashboard/transactions");
  expect(transactionsLink).toBeTruthy();
  fireEvent.click(transactionsLink as HTMLAnchorElement);

  await waitFor(() => {
    expect(
      screen.getAllByRole("heading", { name: "Transactions" }).length,
    ).toBeGreaterThan(0);
  });
});
