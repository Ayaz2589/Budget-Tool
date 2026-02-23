import { test, expect } from "bun:test";
import { collectMissingImportMeta, normalizeImportedData } from "@/lib/import/importNormalize";
import type { ParsedExportedPdf } from "@/types/pdf";

const parsed: ParsedExportedPdf = {
  expenses: [
    {
      id: "exp-1",
      date: "2025-01-01",
      amount: 12,
      description: "Coffee",
      category: "NewCat",
      source: "manual",
      owner: "NewOwner",
    },
  ],
  income: [
    {
      id: "inc-1",
      date: "2025-01-02",
      amount: 100,
      description: "Rent",
      category: "NewIncome",
      owner: "NewOwner",
    },
  ],
  debts: [
    {
      id: "debt-1",
      name: "Loan",
      initialAmount: 1000,
      startDate: "2024-12-01",
      owner: "NewOwner",
    },
  ],
  debtPayments: [],
  presetTransactions: [
    {
      id: "pt-1",
      source: "manual",
      description: "Preset",
      category: "NewCat",
      owner: "NewOwner",
    },
  ],
  expenseCategoriesWithColors: [{ name: "NewCat", color: "#fff" }],
  incomeCategoriesWithColors: [{ name: "NewIncome", color: "#000" }],
  owners: ["NewOwner"],
  cardSources: [],
};

test("collectMissingImportMeta finds missing categories and owners", () => {
  const result = collectMissingImportMeta(parsed, ["Existing"], ["Income"], []);
  expect(result.missingExpenseCategories).toEqual(["NewCat"]);
  expect(result.missingIncomeCategories).toEqual(["NewIncome"]);
  expect(result.missingOwners).toEqual(["NewOwner"]);
});

test("normalizeImportedData clears unknown categories and owners", () => {
  const normalized = normalizeImportedData(
    {
      expenses: parsed.expenses,
      income: parsed.income,
      debts: parsed.debts,
      presetTransactions: parsed.presetTransactions,
    },
    [],
    [],
    []
  );
  expect(normalized.expenses[0]?.category).toBe("");
  expect(normalized.expenses[0]?.owner).toBeUndefined();
  expect(normalized.income[0]?.category).toBe("");
  expect(normalized.income[0]?.owner).toBeUndefined();
  expect(normalized.debts[0]?.owner).toBeUndefined();
  expect(normalized.presetTransactions[0]?.category).toBe("");
  expect(normalized.presetTransactions[0]?.owner).toBe("");
});

test("normalizeImportedData keeps Mortgage expenses categorized as Mortgage", () => {
  const normalized = normalizeImportedData(
    {
      expenses: [
        {
          id: "exp-mortgage",
          date: "2025-01-10",
          amount: 1500,
          description: "Mortgage",
          category: "Mortgage",
          source: "manual",
          owner: "AYAZ UDDIN",
        },
      ],
      income: [],
      debts: [],
      presetTransactions: [],
    },
    ["My Purchase", "Utilities"],
    [],
    ["AYAZ UDDIN"],
  );

  expect(normalized.expenses[0]?.category).toBe("Mortgage");
});
