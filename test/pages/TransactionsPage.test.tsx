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

function TestWrapper({
  initialEntry = "/dashboard/transactions",
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

function selectInDialog(_dialog: HTMLElement, comboboxIndex: number, optionText: string) {
  // Radix marks the dialog aria-hidden while a Select portal is open,
  // so query with hidden=true from the document.
  const combos = screen
    .getAllByRole("combobox", { hidden: true })
    .filter((el) => el.closest('[role="dialog"]'));
  const combo = combos[comboboxIndex]!;
  fireEvent.click(combo);
  const options = screen.queryAllByRole("option", {
    name: new RegExp(optionText, "i"),
    hidden: true,
  });
  if (options.length > 0) {
    fireEvent.click(options[0]!);
  } else {
    const fallback = screen.queryAllByText(new RegExp(optionText, "i"));
    if (fallback.length > 0) {
      fireEvent.click(fallback[0]!);
    }
  }
  // Ensure the select menu is closed before next interaction.
  if (combo.getAttribute("aria-expanded") === "true") {
    fireEvent.keyDown(combo, { key: "Escape" });
  }
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

test("TransactionsPage applies URL query filters and highlight", () => {
  render(
    <TestWrapper initialEntry="/dashboard/transactions?month=2026-02&category=Bills&highlight=e3" />,
  );

  expect(screen.getAllByText("Gamma utilities").length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
});
