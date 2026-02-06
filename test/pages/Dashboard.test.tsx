import { afterEach, test, expect } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { BudgetProvider } from "@/context/BudgetContext";
import { GoogleAuthProviderFallback } from "@/context/GoogleAuthContext";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/dashboard/Dashboard";

const BUDGET_STORAGE_KEY = "budget-tool-data";

function TestWrapper() {
  return (
    <BudgetProvider>
      <GoogleAuthProviderFallback>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/dashboard" element={<Layout />}>
              <Route index element={<Dashboard />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </GoogleAuthProviderFallback>
    </BudgetProvider>
  );
}

afterEach(() => cleanup());

test("Dashboard renders without throwing", () => {
  localStorage.clear();
  render(<TestWrapper />);
  expect(
    screen.getByRole("heading", { name: "Dashboard" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Total income")).toBeInTheDocument();
  expect(screen.getByText("Avg daily spend")).toBeInTheDocument();
  expect(screen.getByText("Largest expense")).toBeInTheDocument();
  expect(screen.getByText("Income coverage")).toBeInTheDocument();
  expect(screen.getByText("Category trend")).toBeInTheDocument();
  expect(screen.getByText("Owner trend")).toBeInTheDocument();
  expect(screen.getByText("Insights")).toBeInTheDocument();
});

test("Dashboard shows owner split controls when owners exist", () => {
  localStorage.clear();
  localStorage.setItem(
    BUDGET_STORAGE_KEY,
    JSON.stringify({
      expenses: [
        {
          id: "e1",
          date: "2026-02-01",
          amount: 100,
          description: "Food",
          category: "Groceries",
          source: "manual",
          owner: "Ayaz",
        },
      ],
      income: [
        {
          id: "i1",
          date: "2026-02-01",
          amount: 2000,
          description: "Salary",
          category: "Paycheck",
          owner: "Ayaz",
        },
      ],
      debts: [],
      debtPayments: [],
      owners: ["Ayaz"],
      iOweNova: {},
      cardSources: ["manual"],
      expenseCategories: ["Groceries"],
      incomeCategories: ["Paycheck"],
    }),
  );

  render(<TestWrapper />);
  expect(screen.getByText("Split view")).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "By owner" })).toBeInTheDocument();
});

test("Dashboard range controls switch chart mode labels", () => {
  localStorage.clear();
  localStorage.setItem(
    BUDGET_STORAGE_KEY,
    JSON.stringify({
      expenses: [
        {
          id: "e1",
          date: "2026-02-01",
          amount: 200,
          description: "Food",
          category: "Groceries",
          source: "manual",
        },
        {
          id: "e2",
          date: "2026-01-01",
          amount: 150,
          description: "Fuel",
          category: "Gas",
          source: "manual",
        },
      ],
      income: [
        {
          id: "i1",
          date: "2026-02-01",
          amount: 2000,
          description: "Salary",
          category: "Paycheck",
        },
      ],
      debts: [],
      debtPayments: [],
      owners: [],
      iOweNova: {},
      cardSources: ["manual"],
      expenseCategories: ["Groceries", "Gas"],
      incomeCategories: ["Paycheck"],
    }),
  );

  render(<TestWrapper />);
  fireEvent.click(screen.getByRole("tab", { name: "Last 6 months" }));
  expect(screen.getByText("Category trend")).toBeInTheDocument();
  expect(screen.getByText("Income vs expense")).toBeInTheDocument();
});
