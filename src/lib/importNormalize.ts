import type { Debt, Expense, Income, PresetTransaction } from "@/types/core";
import type { ParsedExportedPdf } from "@/types/pdf";

export function normalizeImportedData(
  input: {
    expenses: Expense[];
    income: Income[];
    debts: Debt[];
    presetTransactions: PresetTransaction[];
  },
  existingExpenseCategories: string[],
  existingIncomeCategories: string[],
  existingOwners: string[]
) {
  const expenseCatSet = new Set(existingExpenseCategories);
  const incomeCatSet = new Set(existingIncomeCategories);
  const ownerSet = new Set(existingOwners);
  return {
    expenses: input.expenses.map((e) => ({
      ...e,
      category: expenseCatSet.has(e.category) ? e.category : "",
      owner: ownerSet.has(e.owner ?? "") ? e.owner : undefined,
    })),
    income: input.income.map((i) => ({
      ...i,
      category: incomeCatSet.has(i.category) ? i.category : "",
      owner: ownerSet.has(i.owner ?? "") ? i.owner : undefined,
    })),
    debts: input.debts.map((d) => ({
      ...d,
      owner: ownerSet.has(d.owner ?? "") ? d.owner : undefined,
    })),
    presetTransactions: input.presetTransactions.map((p) => ({
      ...p,
      category: expenseCatSet.has(p.category ?? "") ? p.category : "",
      owner: ownerSet.has(p.owner ?? "") ? p.owner : "",
    })),
  };
}

export function collectMissingImportMeta(
  parsed: ParsedExportedPdf,
  existingExpenseCategories: string[],
  existingIncomeCategories: string[],
  existingOwners: string[]
) {
  const existingExpenseSet = new Set(existingExpenseCategories);
  const existingIncomeSet = new Set(existingIncomeCategories);
  const existingOwnerSet = new Set(existingOwners);
  const missingExpenseSet = new Set<string>();
  const missingIncomeSet = new Set<string>();
  const missingOwnerSet = new Set<string>();

  for (const name of parsed.expenseCategoriesWithColors?.map((x) => x.name) ?? []) {
    if (name && !existingExpenseSet.has(name)) missingExpenseSet.add(name);
  }
  for (const name of parsed.incomeCategoriesWithColors?.map((x) => x.name) ?? []) {
    if (name && !existingIncomeSet.has(name)) missingIncomeSet.add(name);
  }
  for (const name of parsed.owners ?? []) {
    if (name && !existingOwnerSet.has(name)) missingOwnerSet.add(name);
  }

  for (const e of parsed.expenses) {
    const cat = (e.category || "").trim();
    const owner = (e.owner || "").trim();
    if (cat && !existingExpenseSet.has(cat)) missingExpenseSet.add(cat);
    if (owner && !existingOwnerSet.has(owner)) missingOwnerSet.add(owner);
  }
  for (const i of parsed.income) {
    const cat = (i.category || "").trim();
    const owner = (i.owner || "").trim();
    if (cat && !existingIncomeSet.has(cat)) missingIncomeSet.add(cat);
    if (owner && !existingOwnerSet.has(owner)) missingOwnerSet.add(owner);
  }
  for (const d of parsed.debts) {
    const owner = (d.owner || "").trim();
    if (owner && !existingOwnerSet.has(owner)) missingOwnerSet.add(owner);
  }
  for (const p of parsed.presetTransactions) {
    const cat = (p.category || "").trim();
    const owner = (p.owner || "").trim();
    if (cat && !existingExpenseSet.has(cat)) missingExpenseSet.add(cat);
    if (owner && !existingOwnerSet.has(owner)) missingOwnerSet.add(owner);
  }

  return {
    missingExpenseCategories: Array.from(missingExpenseSet),
    missingIncomeCategories: Array.from(missingIncomeSet),
    missingOwners: Array.from(missingOwnerSet),
  };
}
