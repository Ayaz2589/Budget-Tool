import { describe, test, expect } from "bun:test";
import {
  migrateCategoryString,
  migrateCategories,
} from "@/lib/categories/migration";
import type { Expense, Income } from "@/types/core";

// ---------------------------------------------------------------------------
// Helper to create minimal test records
// ---------------------------------------------------------------------------

function makeExpense(category: string): Expense {
  return {
    id: crypto.randomUUID(),
    date: "2025-01-15",
    amount: 100,
    description: "Test",
    category,
    source: "manual",
  };
}

function makeIncome(category: string): Income {
  return {
    id: crypto.randomUUID(),
    date: "2025-01-15",
    amount: 1000,
    description: "Test",
    category,
  };
}

// ---------------------------------------------------------------------------
// migrateCategoryString — expense
// ---------------------------------------------------------------------------

describe("migrateCategoryString (expense)", () => {
  test("already-composite keys are unchanged", () => {
    expect(migrateCategoryString("Food > Groceries", "expense")).toBe(
      "Food > Groceries",
    );
    expect(migrateCategoryString("Home > Utilities", "expense")).toBe(
      "Home > Utilities",
    );
  });

  test("empty / whitespace returns empty", () => {
    expect(migrateCategoryString("", "expense")).toBe("");
    expect(migrateCategoryString("   ", "expense")).toBe("");
  });

  test("known aliases map correctly", () => {
    expect(migrateCategoryString("Dining", "expense")).toBe(
      "Food > Dining Out",
    );
    expect(migrateCategoryString("dining", "expense")).toBe(
      "Food > Dining Out",
    );
    expect(migrateCategoryString("Amazon", "expense")).toBe(
      "Shopping > Electronics",
    );
    expect(migrateCategoryString("Mortgage", "expense")).toBe(
      "Home > Rent/Mortgage",
    );
    expect(migrateCategoryString("Transport", "expense")).toBe(
      "Transport > Gas/Fuel",
    );
  });

  test("exact subcategory name match", () => {
    expect(migrateCategoryString("Groceries", "expense")).toBe(
      "Food > Groceries",
    );
    expect(migrateCategoryString("Utilities", "expense")).toBe(
      "Home > Utilities",
    );
    expect(migrateCategoryString("Fitness", "expense")).toBe(
      "Health > Fitness",
    );
    expect(migrateCategoryString("Clothing", "expense")).toBe(
      "Shopping > Clothing",
    );
  });

  test("case-insensitive subcategory match", () => {
    expect(migrateCategoryString("groceries", "expense")).toBe(
      "Food > Groceries",
    );
    expect(migrateCategoryString("UTILITIES", "expense")).toBe(
      "Home > Utilities",
    );
  });

  test("parent name match maps to first sub", () => {
    expect(migrateCategoryString("Food", "expense")).toBe(
      "Food > Groceries",
    );
    expect(migrateCategoryString("Health", "expense")).toBe(
      "Health > Medical",
    );
    expect(migrateCategoryString("Shopping", "expense")).toBe(
      "Shopping > Clothing",
    );
  });

  test("unknown returns empty (uncategorized)", () => {
    expect(migrateCategoryString("RandomStuff", "expense")).toBe("");
    expect(migrateCategoryString("My Custom Cat", "expense")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// migrateCategoryString — income
// ---------------------------------------------------------------------------

describe("migrateCategoryString (income)", () => {
  test("known aliases map correctly", () => {
    expect(migrateCategoryString("Paycheck", "income")).toBe(
      "Income > Salary",
    );
    expect(migrateCategoryString("Rent", "income")).toBe(
      "Income > Rental Income",
    );
    expect(migrateCategoryString("Side Hustle", "income")).toBe(
      "Income > Freelance",
    );
    expect(migrateCategoryString("Other", "income")).toBe("");
  });

  test("exact subcategory name match", () => {
    expect(migrateCategoryString("Salary", "income")).toBe("Income > Salary");
    expect(migrateCategoryString("Freelance", "income")).toBe(
      "Income > Freelance",
    );
    expect(migrateCategoryString("Bonus", "income")).toBe("Income > Bonus");
    expect(migrateCategoryString("Investments", "income")).toBe(
      "Income > Investments",
    );
  });

  test("already-composite keys are unchanged", () => {
    expect(migrateCategoryString("Income > Salary", "income")).toBe(
      "Income > Salary",
    );
  });
});

// ---------------------------------------------------------------------------
// migrateCategories (batch)
// ---------------------------------------------------------------------------

describe("migrateCategories", () => {
  test("migrates flat expenses and income together", () => {
    const expenses = [
      makeExpense("Groceries"),
      makeExpense("Dining"),
      makeExpense(""),
    ];
    const income = [makeIncome("Paycheck"), makeIncome("Bonus")];

    const result = migrateCategories(expenses, income);

    expect(result.expenses[0]!.category).toBe("Food > Groceries");
    expect(result.expenses[1]!.category).toBe("Food > Dining Out");
    expect(result.expenses[2]!.category).toBe("");
    expect(result.income[0]!.category).toBe("Income > Salary");
    expect(result.income[1]!.category).toBe("Income > Bonus");
    expect(result.expensesMigrated).toBe(2);
    expect(result.incomeMigrated).toBe(2);
  });

  test("does not mutate originals", () => {
    const expenses = [makeExpense("Groceries")];
    const income = [makeIncome("Paycheck")];

    const result = migrateCategories(expenses, income);

    expect(expenses[0]!.category).toBe("Groceries");
    expect(income[0]!.category).toBe("Paycheck");
    expect(result.expenses[0]!.category).toBe("Food > Groceries");
    expect(result.income[0]!.category).toBe("Income > Salary");
  });

  test("skips already-migrated records", () => {
    const expenses = [makeExpense("Food > Groceries")];
    const income = [makeIncome("Income > Salary")];

    const result = migrateCategories(expenses, income);

    expect(result.expenses[0]!.category).toBe("Food > Groceries");
    expect(result.income[0]!.category).toBe("Income > Salary");
    expect(result.expensesMigrated).toBe(0);
    expect(result.incomeMigrated).toBe(0);
  });

  test("handles mixed migrated and unmigrated records", () => {
    const expenses = [
      makeExpense("Food > Groceries"), // already migrated
      makeExpense("Dining"), // needs migration
      makeExpense(""), // empty stays empty
    ];
    const income: Income[] = [];

    const result = migrateCategories(expenses, income);

    expect(result.expenses[0]!.category).toBe("Food > Groceries");
    expect(result.expenses[1]!.category).toBe("Food > Dining Out");
    expect(result.expenses[2]!.category).toBe("");
    expect(result.expensesMigrated).toBe(1);
    expect(result.incomeMigrated).toBe(0);
  });

  test("preserves all non-category fields", () => {
    const expense = makeExpense("Groceries");
    expense.owner = "Alice";
    expense.source = "amex";

    const result = migrateCategories([expense], []);

    expect(result.expenses[0]!.id).toBe(expense.id);
    expect(result.expenses[0]!.date).toBe(expense.date);
    expect(result.expenses[0]!.amount).toBe(expense.amount);
    expect(result.expenses[0]!.description).toBe(expense.description);
    expect(result.expenses[0]!.owner).toBe("Alice");
    expect(result.expenses[0]!.source).toBe("amex");
  });
});
