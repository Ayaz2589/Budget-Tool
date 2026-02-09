import { beforeEach, expect, test } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BudgetProvider, useBudget } from "@/context/BudgetContext";

function CategorySanitizationProbe() {
  const { addExpense, setExpenseCategories, expenses } = useBudget();
  return (
    <div>
      <button
        onClick={() =>
          addExpense({
            date: "2026-02-01",
            amount: 100,
            description: "Mortgage Payment",
            category: "Mortgage",
            source: "manual",
            owner: "AYAZ UDDIN",
          })
        }
      >
        add-mortgage
      </button>
      <button onClick={() => setExpenseCategories(["My Purchase"])}>
        sanitize-categories
      </button>
      <p data-testid="category">{expenses[0]?.category ?? ""}</p>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
});

test("setExpenseCategories does not strip Mortgage category", async () => {
  render(
    <BudgetProvider>
      <CategorySanitizationProbe />
    </BudgetProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "add-mortgage" }));
  await waitFor(() =>
    expect(screen.getByTestId("category").textContent).toBe("Mortgage"),
  );

  fireEvent.click(screen.getByRole("button", { name: "sanitize-categories" }));
  await waitFor(() =>
    expect(screen.getByTestId("category").textContent).toBe("Mortgage"),
  );
});

