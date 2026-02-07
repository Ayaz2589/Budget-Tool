import { afterEach, test, expect } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { IncomePage } from "@/pages/income/IncomePage";
import { BudgetProvider } from "@/context/BudgetContext";
import { PresetTransactionsProvider } from "@/context/PresetTransactionsContext";

const BUDGET_STORAGE_KEY = "budget-tool-data";

afterEach(() => cleanup());

test("IncomePage shows delete income confirmation dialog when delete is clicked", () => {
  localStorage.clear();
  localStorage.setItem(
    BUDGET_STORAGE_KEY,
    JSON.stringify({
      income: [
        {
          id: "i1",
          date: "2025-01-01",
          amount: 100,
          description: "Pay",
          category: "Rent",
          owner: "Ayaz",
        },
      ],
      expenses: [],
      debts: [],
      debtPayments: [],
    }),
  );

  render(
    <BudgetProvider>
      <PresetTransactionsProvider>
        <IncomePage />
      </PresetTransactionsProvider>
    </BudgetProvider>,
  );

  fireEvent.click(screen.getAllByRole("button", { name: /Pay/i })[0]!);
  fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]!);

  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText("Delete this income?")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Delete", hidden: false }),
  ).toBeInTheDocument();
});

test("IncomePage opens add income sheet from page action", () => {
  localStorage.clear();

  render(
    <BudgetProvider>
      <PresetTransactionsProvider>
        <IncomePage />
      </PresetTransactionsProvider>
    </BudgetProvider>,
  );

  const addButtons = screen.getAllByRole("button", { name: /add income/i });
  fireEvent.click(addButtons[0]!);
  expect(screen.getAllByText("New income").length).toBeGreaterThan(0);
});

test("IncomePage groups entries by month", () => {
  localStorage.clear();
  localStorage.setItem(
    BUDGET_STORAGE_KEY,
    JSON.stringify({
      income: [
        {
          id: "i1",
          date: "2026-02-01",
          amount: 100,
          description: "Feb income",
          category: "Other",
          owner: "Ayaz",
        },
        {
          id: "i2",
          date: "2026-01-01",
          amount: 100,
          description: "Jan income",
          category: "Other",
          owner: "Ayaz",
        },
      ],
      expenses: [],
      debts: [],
      debtPayments: [],
    }),
  );

  render(
    <BudgetProvider>
      <PresetTransactionsProvider>
        <IncomePage />
      </PresetTransactionsProvider>
    </BudgetProvider>,
  );

  expect(screen.getAllByText("February 2026").length).toBeGreaterThan(0);
  expect(screen.getAllByText("January 2026").length).toBeGreaterThan(0);
});
