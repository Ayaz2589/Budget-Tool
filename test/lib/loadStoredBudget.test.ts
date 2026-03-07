import { beforeEach, test, expect } from "bun:test";
import { storage, STORAGE_KEYS } from "@/lib/platform/storage";
import { loadStoredBudget } from "@/context/BudgetContext";

beforeEach(() => {
  localStorage.clear();
});

test("filters out expenses with NaN amount", () => {
  storage.setItem(
    STORAGE_KEYS.BUDGET_DATA,
    JSON.stringify({
      expenses: [
        { id: "1", date: "2026-01-15", amount: 50, description: "Valid", category: "Food", source: "manual" },
        { id: "2", date: "2026-01-16", amount: NaN, description: "Bad", category: "Food", source: "manual" },
      ],
      income: [],
    }),
  );
  const data = loadStoredBudget();
  expect(data.expenses.length).toBe(1);
  expect(data.expenses[0]!.id).toBe("1");
});

test("filters out expenses with invalid date", () => {
  storage.setItem(
    STORAGE_KEYS.BUDGET_DATA,
    JSON.stringify({
      expenses: [
        { id: "1", date: "2026-01-15", amount: 50, description: "Valid", category: "Food", source: "manual" },
        { id: "2", date: "not-a-date", amount: 30, description: "Bad date", category: "Food", source: "manual" },
      ],
      income: [],
    }),
  );
  const data = loadStoredBudget();
  expect(data.expenses.length).toBe(1);
  expect(data.expenses[0]!.id).toBe("1");
});

test("filters out income with non-finite amount", () => {
  storage.setItem(
    STORAGE_KEYS.BUDGET_DATA,
    JSON.stringify({
      expenses: [],
      income: [
        { id: "1", date: "2026-01-15", amount: 1000, description: "Salary", category: "Job" },
        { id: "2", date: "2026-01-16", amount: Infinity, description: "Bad", category: "Job" },
      ],
    }),
  );
  const data = loadStoredBudget();
  expect(data.income.length).toBe(1);
  expect(data.income[0]!.id).toBe("1");
});

test("keeps valid data when all records pass validation", () => {
  storage.setItem(
    STORAGE_KEYS.BUDGET_DATA,
    JSON.stringify({
      expenses: [
        { id: "1", date: "2026-01-15", amount: 50, description: "Coffee", category: "Food", source: "manual" },
      ],
      income: [
        { id: "1", date: "2026-01-15", amount: 1000, description: "Salary", category: "Job" },
      ],
    }),
  );
  const data = loadStoredBudget();
  expect(data.expenses.length).toBe(1);
  expect(data.income.length).toBe(1);
});
