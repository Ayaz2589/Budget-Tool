import { afterEach, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { BudgetProvider } from "@/context";
import { GoogleAuthProviderFallback } from "@/context";
import { PresetTransactionsProvider } from "@/context";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/dashboard/Dashboard";

const BUDGET_STORAGE_KEY = "budget-tool-data";

function LocationEcho() {
  const location = useLocation();
  return (
    <p>{`${location.pathname}${location.search}`}</p>
  );
}

function TestWrapper() {
  return (
    <BudgetProvider>
      <PresetTransactionsProvider>
        <GoogleAuthProviderFallback>
          <MemoryRouter initialEntries={["/dashboard"]}>
            <Routes>
              <Route path="/dashboard" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="transactions" element={<LocationEcho />} />
                <Route path="debt" element={<LocationEcho />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </GoogleAuthProviderFallback>
      </PresetTransactionsProvider>
    </BudgetProvider>
  );
}

afterEach(() => cleanup());

test("Dashboard renders PRD sections", () => {
  localStorage.clear();
  localStorage.setItem(
    BUDGET_STORAGE_KEY,
    JSON.stringify({
      expenses: [
        {
          id: "e1",
          date: "2026-02-01",
          amount: 100,
          description: "Groceries",
          category: "Food",
          source: "manual",
          owner: "Ayaz",
        },
      ],
      income: [
        {
          id: "i1",
          date: "2026-02-01",
          amount: 3000,
          description: "Salary",
          category: "Paycheck",
          owner: "Ayaz",
        },
      ],
      debts: [],
      debtPayments: [],
      owners: ["Ayaz", "Tasnuva"],
      ownerBalances: {},
      cardSources: ["manual"],
      expenseCategories: ["Food"],
      incomeCategories: ["Paycheck"],
    }),
  );
  render(<TestWrapper />);
  expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
  expect(screen.getByText("Net Cash Flow (MTD)")).toBeInTheDocument();
  expect(screen.getByText("Income vs Expenses")).toBeInTheDocument();
  expect(screen.getByText("Spending Breakdown")).toBeInTheDocument();
  expect(screen.getByText("Shared vs Individual Spending")).toBeInTheDocument();
  expect(screen.getByText("Debt Snapshot")).toBeInTheDocument();
  expect(screen.getByText("Recent Activity")).toBeInTheDocument();
});

test("Dashboard settings modal toggles mortgage exclusion", () => {
  localStorage.clear();
  render(<TestWrapper />);
  fireEvent.click(screen.getByRole("button", { name: "Settings" }));
  const switches = screen.getAllByRole("switch");
  // Second switch: Exclude Mortgage (unchecked by default)
  expect(switches[1]).toHaveAttribute("data-state", "unchecked");
  fireEvent.click(switches[1]);
  return waitFor(() => {
    expect(switches[1]).toHaveAttribute("data-state", "checked");
  });
});

test("Dashboard settings modal toggles debt payment inclusion", () => {
  localStorage.clear();
  render(<TestWrapper />);
  fireEvent.click(screen.getByRole("button", { name: "Settings" }));
  const switches = screen.getAllByRole("switch");
  // Third switch: Include Debt Payments (checked by default)
  expect(switches[2]).toHaveAttribute("data-state", "checked");
  fireEvent.click(switches[2]);
  return waitFor(() => {
    expect(switches[2]).toHaveAttribute("data-state", "unchecked");
  });
});

test("Dashboard debt row is read-only", () => {
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
          startDate: "2026-01-01",
        },
      ],
      debtPayments: [],
      owners: [],
      ownerBalances: {},
      cardSources: ["manual"],
      expenseCategories: [],
      incomeCategories: [],
    }),
  );
  render(<TestWrapper />);
  expect(screen.getByText("Car loan")).toBeInTheDocument();
  expect(screen.queryByText("/dashboard/debt?debtId=d1")).toBeNull();
});

// TODO: Owner names render inside chart widgets that report 0×0 in happy-dom; fix when widget test harness is available
test.skip("Dashboard can switch between household and individual view", async () => {
  localStorage.clear();
  localStorage.setItem(
    BUDGET_STORAGE_KEY,
    JSON.stringify({
      expenses: [
        {
          id: "e1",
          date: "2026-02-01",
          amount: 1200,
          description: "Rent",
          category: "Housing",
          source: "manual",
          paidByOwner: "Ayaz",
        },
        {
          id: "e2",
          date: "2026-02-03",
          amount: 300,
          description: "Groceries",
          category: "Food",
          source: "manual",
          paidByOwner: "Tasnuva",
        },
      ],
      income: [],
      debts: [],
      debtPayments: [],
      owners: ["Ayaz", "Tasnuva"],
      ownerBalances: {},
      cardSources: ["manual"],
      expenseCategories: ["Housing", "Food"],
      incomeCategories: [],
    }),
  );

  render(<TestWrapper />);
  await waitFor(() => {
    expect(screen.getAllByText(/Ayaz/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Tasnuva/i).length).toBeGreaterThan(0);
  });

  fireEvent.click(screen.getByRole("button", { name: "Settings" }));
  fireEvent.click(screen.getByRole("button", { name: "Individual" }));

  await waitFor(() => {
    expect(screen.getAllByText(/Ayaz/i).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/Tasnuva/i).length).toBe(0);
  });
});
