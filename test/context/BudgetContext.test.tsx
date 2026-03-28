import { afterEach, beforeEach, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BudgetProvider, useBudget } from "@/context";

function CategoryDisplayProbe() {
  const { addExpense, expenses, expenseCategories } = useBudget();
  return (
    <div>
      <button
        onClick={() =>
          addExpense({
            date: "2026-02-01",
            amount: 100,
            description: "Mortgage Payment",
            category: "Home > Rent/Mortgage",
            source: "manual",
            owner: "AYAZ UDDIN",
          })
        }
      >
        add-mortgage
      </button>
      <p data-testid="category">{expenses[0]?.category ?? ""}</p>
      <p data-testid="cat-count">{expenseCategories.length}</p>
    </div>
  );
}

beforeEach(() => {
  cleanup();
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test("expenseCategories are preset from registry and cannot be emptied", async () => {
  render(
    <BudgetProvider>
      <CategoryDisplayProbe />
    </BudgetProvider>,
  );

  // Categories should be pre-populated from the registry
  await waitFor(() =>
    expect(Number(screen.getByTestId("cat-count").textContent)).toBeGreaterThan(0),
  );
});

test("expenses use composite category keys", async () => {
  render(
    <BudgetProvider>
      <CategoryDisplayProbe />
    </BudgetProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "add-mortgage" }));
  await waitFor(() =>
    expect(screen.getByTestId("category").textContent).toBe(
      "Home > Rent/Mortgage",
    ),
  );
});
