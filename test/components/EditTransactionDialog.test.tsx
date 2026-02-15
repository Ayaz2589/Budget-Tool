import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { BudgetProvider } from "@/context";
import { EditTransactionDialog } from "@/pages/transactions/EditTransactionDialog";
import type { Expense, ExpenseSource } from "@/types/core";
import i18n from "@/i18n";

const BUDGET_STORAGE_KEY = "budget-tool-data";
const UI_FORMAT_STORAGE_KEY = "budget-tool-ui-format";

function setupStorage() {
  localStorage.setItem(
    BUDGET_STORAGE_KEY,
    JSON.stringify({
      expenses: [],
      income: [],
      debts: [],
      debtPayments: [],
      ownerBalances: {},
      cardSources: ["manual", "amex", "td"],
      expenseCategories: ["Food", "Bills", "Transport"],
      incomeCategories: [],
      owners: ["Alice", "Bob"],
    }),
  );
  localStorage.setItem(
    UI_FORMAT_STORAGE_KEY,
    JSON.stringify({ dateFormat: "YYYY/MM/DD" }),
  );
}

const MOCK_EXPENSE: Expense = {
  id: "e1",
  date: "2026-02-10",
  amount: 42.5,
  description: "Coffee beans",
  category: "Food",
  source: "amex",
  owner: "Alice",
  paidByOwner: "Alice",
  allocationMode: "single",
  allocation: [{ owner: "Alice", percent: 100 }],
};

function renderDialog({
  expense = MOCK_EXPENSE,
  onClose = () => {},
  onSubmit = () => {},
}: {
  expense?: Expense | null;
  onClose?: () => void;
  onSubmit?: (
    id: string,
    updates: {
      date: string;
      amount: number;
      description: string;
      category: string;
      source: ExpenseSource;
      owner?: string;
      paidByOwner?: string;
      allocationMode?: "single" | "equal" | "custom";
      allocation?: Array<{ owner: string; percent: number }>;
    },
  ) => void;
} = {}) {
  return render(
    <BudgetProvider>
      <EditTransactionDialog
        expense={expense}
        onClose={onClose}
        onSubmit={onSubmit}
        expenseCategories={["Food", "Bills", "Transport"]}
        ownerOptions={["Alice", "Bob"]}
        cardSources={["manual", "amex", "td"]}
      />
    </BudgetProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  setupStorage();
});

afterEach(() => cleanup());

// ---------------------------------------------------------------------------
// Basic rendering
// ---------------------------------------------------------------------------

test("EditTransactionDialog renders when expense is provided", () => {
  renderDialog();
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText(i18n.t("common.edit"))).toBeInTheDocument();
});

test("EditTransactionDialog does not render when expense is null", () => {
  renderDialog({ expense: null });
  expect(screen.queryByRole("dialog")).toBeNull();
});

// ---------------------------------------------------------------------------
// Field population
// ---------------------------------------------------------------------------

test("EditTransactionDialog populates amount from expense", () => {
  renderDialog();
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByDisplayValue("$42.50")).toBeInTheDocument();
});

test("EditTransactionDialog populates description from expense", () => {
  renderDialog();
  const dialog = screen.getByRole("dialog");
  expect(
    within(dialog).getByDisplayValue("Coffee beans"),
  ).toBeInTheDocument();
});

// ---------------------------------------------------------------------------
// Save and Cancel
// ---------------------------------------------------------------------------

test("EditTransactionDialog calls onSubmit with updated data on save", () => {
  const onSubmit = mock(
    (
      _id: string,
      _updates: {
        date: string;
        amount: number;
        description: string;
        category: string;
        source: ExpenseSource;
      },
    ) => {},
  );
  const onClose = mock(() => {});
  renderDialog({ onSubmit, onClose });
  const dialog = screen.getByRole("dialog");

  // Change description
  const descInput = within(dialog).getByDisplayValue("Coffee beans");
  fireEvent.change(descInput, { target: { value: "Tea leaves" } });

  // Click save
  fireEvent.click(within(dialog).getByRole("button", { name: i18n.t("common.save") }));

  expect(onSubmit).toHaveBeenCalledTimes(1);
  const [id, updates] = onSubmit.mock.calls[0]!;
  expect(id).toBe("e1");
  expect(updates.description).toBe("Tea leaves");
  expect(updates.amount).toBe(42.5);
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("EditTransactionDialog calls onClose on cancel", () => {
  const onClose = mock(() => {});
  renderDialog({ onClose });
  const dialog = screen.getByRole("dialog");

  fireEvent.click(
    within(dialog).getByRole("button", { name: i18n.t("common.cancel") }),
  );
  expect(onClose).toHaveBeenCalledTimes(1);
});

// ---------------------------------------------------------------------------
// Amount editing
// ---------------------------------------------------------------------------

test("EditTransactionDialog submits updated amount", () => {
  const onSubmit = mock(
    (
      _id: string,
      _updates: {
        date: string;
        amount: number;
        description: string;
        category: string;
        source: ExpenseSource;
      },
    ) => {},
  );
  renderDialog({ onSubmit });
  const dialog = screen.getByRole("dialog");

  const amountInput = within(dialog).getByDisplayValue("$42.50");
  fireEvent.change(amountInput, { target: { value: "$99.99" } });
  fireEvent.click(within(dialog).getByRole("button", { name: i18n.t("common.save") }));

  expect(onSubmit).toHaveBeenCalledTimes(1);
  const [, updates] = onSubmit.mock.calls[0]!;
  expect(updates.amount).toBe(99.99);
});

// ---------------------------------------------------------------------------
// Labels and structure
// ---------------------------------------------------------------------------

test("EditTransactionDialog shows all field labels", () => {
  renderDialog();
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getAllByText(i18n.t("common.date")).length).toBeGreaterThan(0);
  expect(within(dialog).getAllByText(i18n.t("common.amount")).length).toBeGreaterThan(0);
  expect(within(dialog).getAllByText(i18n.t("common.description")).length).toBeGreaterThan(0);
  expect(within(dialog).getAllByText(i18n.t("common.source")).length).toBeGreaterThan(0);
  expect(within(dialog).getAllByText(i18n.t("common.category")).length).toBeGreaterThan(0);
  expect(within(dialog).getAllByText(i18n.t("addTransaction.paidBy")).length).toBeGreaterThan(0);
  expect(within(dialog).getAllByText(i18n.t("addTransaction.splitMode")).length).toBeGreaterThan(0);
});

test("EditTransactionDialog has both cancel and save buttons", () => {
  renderDialog();
  const dialog = screen.getByRole("dialog");
  expect(
    within(dialog).getByRole("button", { name: i18n.t("common.cancel") }),
  ).toBeInTheDocument();
  expect(
    within(dialog).getByRole("button", { name: i18n.t("common.save") }),
  ).toBeInTheDocument();
});
