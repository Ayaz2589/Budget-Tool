import { afterEach, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { BudgetProvider } from "@/context/BudgetContext";
import { GoogleAuthProviderFallback } from "@/context/GoogleAuthContext";
import { PresetTransactionsProvider } from "@/context/PresetTransactionsContext";
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
      iOweNova: {},
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
  expect(screen.getByText("Fixed Obligations (MTD)")).toBeInTheDocument();
  expect(screen.getByText("Recent Activity")).toBeInTheDocument();
  expect(screen.getByText("Smart Insights & Alerts")).toBeInTheDocument();
});

test("Dashboard shows helper text when mortgage is excluded", () => {
  localStorage.clear();
  render(<TestWrapper />);
  const toggle = screen.getByRole("button", { name: "Exclude Mortgage" });
  fireEvent.mouseDown(toggle);
  fireEvent.click(toggle);
  return waitFor(() => {
    expect(
      screen.getByText("Mortgage excluded from expense totals"),
    ).toBeInTheDocument();
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
      iOweNova: {},
      cardSources: ["manual"],
      expenseCategories: [],
      incomeCategories: [],
    }),
  );
  render(<TestWrapper />);
  expect(screen.getByText("Car loan")).toBeInTheDocument();
  expect(screen.queryByText("/dashboard/debt?debtId=d1")).toBeNull();
});
