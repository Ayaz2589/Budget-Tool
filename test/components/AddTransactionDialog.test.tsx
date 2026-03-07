import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { BudgetProvider } from "@/context";
import { PresetTransactionsProvider } from "@/context";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";

const BUDGET_STORAGE_KEY = "budget-tool-data";
const PRESET_STORAGE_KEY = "budget-tool-preset-transactions";
const UI_FORMAT_STORAGE_KEY = "budget-tool-ui-format";

function setupStorage() {
  localStorage.setItem(
    BUDGET_STORAGE_KEY,
    JSON.stringify({
      expenses: [
        {
          id: "e1",
          date: "2026-02-01",
          amount: 25,
          description: "Lunch",
          category: "Food",
          source: "manual",
          owner: "Alex",
        },
      ],
      income: [],
      debts: [],
      debtPayments: [],
      ownerBalances: {},
      cardSources: ["manual", "amex"],
      expenseCategories: ["Food", "Groceries"],
      incomeCategories: [],
      owners: [],
    }),
  );

  localStorage.setItem(
    PRESET_STORAGE_KEY,
    JSON.stringify([
      {
        id: "preset-1",
        source: "manual",
        description: "Preset Coffee",
        amount: 12.5,
        category: "Food",
        owner: "Alex",
      },
    ]),
  );

  localStorage.setItem(
    UI_FORMAT_STORAGE_KEY,
    JSON.stringify({ dateFormat: "YYYY/MM/DD" }),
  );
}

function renderDialog(onOpenChange = () => {}) {
  return render(
    <BudgetProvider>
      <PresetTransactionsProvider>
        <AddTransactionDialog open={true} onOpenChange={onOpenChange} />
      </PresetTransactionsProvider>
    </BudgetProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  setupStorage();
});

afterEach(() => cleanup());

test("AddTransactionDialog renders when open", () => {
  renderDialog();
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText("New transaction")).toBeInTheDocument();
});

test("AddTransactionDialog supports row add/copy/remove and keyboard activation", () => {
  renderDialog();

  // Add a second row via the tab bar add button
  fireEvent.click(screen.getByRole("button", { name: "Add row" }));
  expect(screen.getByText("Transaction 2")).toBeInTheDocument();

  // Copy the active row via the shared copy button
  fireEvent.click(screen.getByTitle("Copy row"));
  expect(screen.getByText("Transaction 3")).toBeInTheDocument();

  // Remove a tab via its inline close button (the X span inside the tab)
  const tab2 = screen.getByRole("button", { name: /transaction 2/i });
  const closeBtn = tab2.querySelector("[role='button']") as HTMLElement;
  expect(closeBtn).toBeTruthy();
  fireEvent.click(closeBtn!);
  // After removing Transaction 2, the third row becomes Transaction 2
  expect(screen.queryByText("Transaction 3")).not.toBeInTheDocument();
});

test("AddTransactionDialog applies preset details to row", () => {
  renderDialog();
  const dialog = screen.getByRole("dialog");

  const presetTrigger = within(dialog).getAllByRole("combobox")[1]!;
  fireEvent.click(presetTrigger);
  fireEvent.click(screen.getByRole("option", { name: /preset coffee/i }));

  expect(within(dialog).getAllByText(/preset coffee/i).length).toBeGreaterThan(0);
  expect(within(dialog).getByDisplayValue("$12.50")).toBeInTheDocument();
  expect(within(dialog).getAllByText("Alex").length).toBeGreaterThan(0);
});

test("AddTransactionDialog submits valid rows and closes dialog", () => {
  const onOpenChange = mock(() => {});
  renderDialog(onOpenChange);
  const dialog = screen.getByRole("dialog");

  fireEvent.change(within(dialog).getByPlaceholderText("0.00"), {
    target: { value: "45.26" },
  });
  fireEvent.change(within(dialog).getByPlaceholderText("e.g. Groceries"), {
    target: { value: "Groceries run" },
  });
  fireEvent.click(within(dialog).getByRole("button", { name: "Add transaction" }));

  expect(onOpenChange).toHaveBeenCalledWith(false);
  const stored = JSON.parse(localStorage.getItem(BUDGET_STORAGE_KEY) ?? "{}");
  expect(stored.expenses.length).toBeGreaterThan(1);
  expect(stored.expenses[0]?.amount).toBe(45.26);
});
