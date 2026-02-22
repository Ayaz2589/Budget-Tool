import { afterEach, beforeEach, test, expect } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { BudgetProvider } from "@/context";
import { PresetTransactionsProvider } from "@/context";
import { GoogleAuthProviderFallback } from "@/context";
import { Layout } from "@/components/Layout";
import { MortgagePage } from "@/pages/mortgage/MortgagePage";
import i18n from "@/i18n";

const BUDGET_STORAGE_KEY = "budget-tool-data";

function seedBudget(
  expenses: Array<{
    id: string;
    date: string;
    amount: number;
    description: string;
    category: string;
    source: string;
    owner?: string;
  }> = [],
) {
  localStorage.setItem(
    BUDGET_STORAGE_KEY,
    JSON.stringify({
      expenses,
      income: [],
      debts: [],
      debtPayments: [],
      ownerBalances: {},
      cardSources: ["manual", "amex"],
      expenseCategories: ["Food", "Mortgage"],
      incomeCategories: ["Paycheck"],
      owners: ["Alice", "Bob"],
    }),
  );
}

function TestWrapper({
  initialEntry = "/dashboard/mortgage",
}: {
  initialEntry?: string;
}) {
  return (
    <BudgetProvider>
      <PresetTransactionsProvider>
        <GoogleAuthProviderFallback>
          <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
              <Route path="/dashboard" element={<Layout />}>
                <Route path="mortgage" element={<MortgagePage />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </GoogleAuthProviderFallback>
      </PresetTransactionsProvider>
    </BudgetProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => cleanup());

// ---------------------------------------------------------------------------
// Basic rendering
// ---------------------------------------------------------------------------

test("MortgagePage renders without crashing", () => {
  seedBudget();
  render(<TestWrapper />);
  expect(
    screen.getAllByText(i18n.t("mortgage.title")).length,
  ).toBeGreaterThan(0);
});

test("MortgagePage shows empty state when no mortgage payments", () => {
  seedBudget();
  render(<TestWrapper />);
  expect(
    screen.getByText(i18n.t("mortgage.noPaymentsYet")),
  ).toBeInTheDocument();
});

test("MortgagePage shows subtitle", () => {
  seedBudget();
  render(<TestWrapper />);
  expect(
    screen.getByText(i18n.t("mortgage.subtitle")),
  ).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Rendering with mortgage payments
// ---------------------------------------------------------------------------

test("MortgagePage renders mortgage payments from context", () => {
  seedBudget([
    {
      id: "m1",
      date: "2026-01-15",
      amount: 5400,
      description: "Mortgage",
      category: "Mortgage",
      source: "manual",
      owner: "Alice",
    },
    {
      id: "m2",
      date: "2026-02-15",
      amount: 5400,
      description: "Mortgage",
      category: "Mortgage",
      source: "manual",
      owner: "Bob",
    },
  ]);
  render(<TestWrapper />);
  // Should not show empty state
  expect(
    screen.queryByText(i18n.t("mortgage.noPaymentsYet")),
  ).toBeNull();
});

test("MortgagePage only shows mortgage-category expenses", () => {
  seedBudget([
    {
      id: "m1",
      date: "2026-01-15",
      amount: 5400,
      description: "Mortgage",
      category: "Mortgage",
      source: "manual",
    },
    {
      id: "e1",
      date: "2026-01-20",
      amount: 50,
      description: "Groceries",
      category: "Food",
      source: "manual",
    },
  ]);
  render(<TestWrapper />);
  // Should not show empty state since there is a mortgage payment
  expect(
    screen.queryByText(i18n.t("mortgage.noPaymentsYet")),
  ).toBeNull();
});

// ---------------------------------------------------------------------------
// Add payment flow
// ---------------------------------------------------------------------------

test("MortgagePage opens add payment sheet", () => {
  seedBudget();
  render(<TestWrapper />);
  const addButtons = screen.getAllByRole("button", {
    name: new RegExp(i18n.t("mortgage.addMortgagePayment"), "i"),
  });
  fireEvent.click(addButtons[0]!);
  expect(
    screen.getAllByText(i18n.t("mortgage.addMortgagePayment")).length,
  ).toBeGreaterThan(0);
});

test("MortgagePage opens add sheet via tourSheet query param", () => {
  seedBudget();
  render(
    <TestWrapper initialEntry="/dashboard/mortgage?tourSheet=mortgage-add" />,
  );
  expect(
    screen.getAllByText(i18n.t("mortgage.addMortgagePayment")).length,
  ).toBeGreaterThan(0);
});

test("MortgagePage has mobile add button", () => {
  seedBudget();
  render(<TestWrapper />);
  const addButtons = screen.getAllByRole("button", {
    name: i18n.t("mortgage.addMortgagePayment"),
  });
  expect(addButtons.length).toBeGreaterThan(0);
});
