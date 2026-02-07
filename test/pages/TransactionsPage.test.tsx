import { beforeEach, test, expect } from "bun:test";
import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { BudgetProvider } from "@/context/BudgetContext";
import { PresetTransactionsProvider } from "@/context/PresetTransactionsContext";
import { GoogleAuthProviderFallback } from "@/context/GoogleAuthContext";
import { Layout } from "@/components/Layout";
import { TransactionsPage } from "@/pages/transactions/TransactionsPage";

const STORAGE_KEY = "budget-tool-data";

type ExpenseFixture = {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  source:
    | "amex"
    | "amex-gold"
    | "apple"
    | "visa"
    | "sapphire"
    | "bank-of-america"
    | "wells-fargo"
    | "chase"
    | "manual"
    | "td";
  owner?: string;
};

const DEFAULT_EXPENSES: ExpenseFixture[] = [
  {
    id: "e1",
    date: "2026-01-10",
    amount: 20,
    description: "Alpha grocery",
    category: "Food",
    source: "amex",
    owner: "Alice",
  },
  {
    id: "e2",
    date: "2026-01-12",
    amount: 100,
    description: "Beta rent",
    category: "",
    source: "td",
  },
  {
    id: "e3",
    date: "2026-02-02",
    amount: 50,
    description: "Gamma utilities",
    category: "Bills",
    source: "td",
    owner: "Bob",
  },
  {
    id: "e4",
    date: "invalid-date",
    amount: 500,
    description: "Invalid date record",
    category: "Food",
    source: "manual",
  },
  {
    id: "e5",
    date: "2026-01-20",
    amount: 600,
    description: "Mortgage should be hidden",
    category: "Mortgage",
    source: "chase",
  },
];

function seedBudget(expenses: ExpenseFixture[] = DEFAULT_EXPENSES) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      expenses,
      income: [],
      debts: [],
      debtPayments: [],
      iOweNova: {},
      cardSources: ["amex", "td", "manual", "chase"],
      expenseCategories: ["Food", "Bills"],
      incomeCategories: ["Paycheck"],
      owners: [],
    }),
  );
}

function TestWrapper() {
  return (
    <BudgetProvider>
      <PresetTransactionsProvider>
        <GoogleAuthProviderFallback>
          <MemoryRouter initialEntries={["/dashboard/transactions"]}>
            <Routes>
              <Route path="/dashboard" element={<Layout />}>
                <Route path="transactions" element={<TransactionsPage />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </GoogleAuthProviderFallback>
      </PresetTransactionsProvider>
    </BudgetProvider>
  );
}

function openFiltersDialog() {
  const filterButtons = screen.getAllByRole("button", {
    name: /filters and actions|filters & actions/i,
  });
  fireEvent.click(filterButtons[0]!);
  return screen.getByRole("dialog");
}

function selectInDialog(dialog: HTMLElement, comboboxIndex: number, optionText: string) {
  const combos = within(dialog).getAllByRole("combobox");
  fireEvent.click(combos[comboboxIndex]!);
  const options = screen.queryAllByRole("option", { name: optionText });
  if (options.length > 0) {
    fireEvent.click(options[0]!);
    return;
  }
  fireEvent.click(screen.getAllByText(optionText)[0]!);
}

beforeEach(() => {
  localStorage.clear();
  seedBudget();
});

test("TransactionsPage renders without throwing", () => {
  render(<TestWrapper />);
  expect(
    screen.getAllByRole("heading", { name: "Transactions" }).length,
  ).toBeGreaterThan(0);
});

test("TransactionsPage opens add transaction sheet", () => {
  render(<TestWrapper />);
  const addButtons = screen.getAllByRole("button", { name: /add expense/i });
  fireEvent.click(addButtons[0]!);
  expect(screen.getAllByText("New transaction").length).toBeGreaterThan(0);
});

test("TransactionsPage opens filters and actions sheet", () => {
  render(<TestWrapper />);
  const dialog = openFiltersDialog();
  expect(dialog).toBeInTheDocument();
  expect(screen.getAllByText(/filters/i).length).toBeGreaterThan(0);
});

test("TransactionsPage applies all filter branches and can clear filters", () => {
  render(<TestWrapper />);

  expect(screen.getAllByText("Gamma utilities").length).toBeGreaterThan(0);
  expect(screen.queryByText("Mortgage should be hidden")).toBeNull();
  expect(screen.queryByText("Invalid date record")).toBeNull();

  const dialog = openFiltersDialog();

  const monthInput = within(dialog).getByPlaceholderText("YYYY-MM");
  fireEvent.change(monthInput, { target: { value: "2026-02" } });

  const searchLabel = within(dialog).getByText(/Search description/i);
  const searchInput = searchLabel.parentElement?.querySelector("input");
  expect(searchInput).not.toBeNull();
  fireEvent.change(searchInput!, { target: { value: "  gamma  " } });

  fireEvent.change(monthInput, { target: { value: "" } });
  fireEvent.change(searchInput!, { target: { value: "" } });

  selectInDialog(dialog, 0, "TD Bank");

  selectInDialog(dialog, 1, "Uncategorized");

  selectInDialog(dialog, 2, "No Owner");

  fireEvent.change(monthInput, { target: { value: "" } });
  selectInDialog(dialog, 2, "Bob");

  fireEvent.click(within(dialog).getByRole("button", { name: "Clear filters" }));
  fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

  fireEvent.click(
    screen.getAllByRole("button", { name: /January 2026/i }).at(-1)!,
  );
  expect(screen.getAllByText("Beta rent").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Gamma utilities").length).toBeGreaterThan(0);
});

test("TransactionsPage supports sorting branches and row tap actions", () => {
  render(<TestWrapper />);

  fireEvent.click(screen.getAllByRole("button", { name: /^Amount/i })[0]!);
  fireEvent.click(screen.getAllByRole("button", { name: /^Amount/i })[0]!);
  fireEvent.click(screen.getAllByRole("button", { name: /^Description/i })[0]!);
  fireEvent.click(screen.getAllByRole("button", { name: /^Source/i })[0]!);
  fireEvent.click(screen.getAllByRole("button", { name: /^Owner/i })[0]!);
  fireEvent.click(screen.getAllByRole("button", { name: /^Category/i })[0]!);

  fireEvent.click(screen.getAllByRole("button", { name: /Gamma utilities/i })[0]!);
  fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]!);
  const deleteDialog = screen.getByRole("dialog", {
    name: "Delete this transaction?",
  });
  expect(deleteDialog).toBeInTheDocument();
  fireEvent.click(within(deleteDialog).getByRole("button", { name: "Cancel" }));
});

test("TransactionsPage shows empty state when no valid non-mortgage expenses", () => {
  seedBudget([
    {
      id: "m-only",
      date: "2026-01-02",
      amount: 400,
      description: "Mortgage only",
      category: "Mortgage",
      source: "td",
    },
    {
      id: "invalid",
      date: "bad",
      amount: 10,
      description: "Bad date",
      category: "Food",
      source: "manual",
    },
  ]);

  render(<TestWrapper />);
  expect(
    screen.getByText("No transactions yet. Import a CSV or add one manually."),
  ).toBeInTheDocument();
});
