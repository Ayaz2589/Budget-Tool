import type {
  Debt,
  DebtPayment,
  Expense,
  Income,
  OwnerTransfer,
  PresetTransaction,
} from "@/types/core";
import type { CategoryWithColorPayload, ExpandedPayload } from "@/types/payload";

export function buildExpandedPayload(
  expenses: Expense[],
  income: Income[],
  debts: Debt[],
  debtPayments: DebtPayment[],
  presetTransactions: PresetTransaction[],
  expenseCategoriesWithColors: CategoryWithColorPayload[] = [],
  incomeCategoriesWithColors: CategoryWithColorPayload[] = [],
  owners: string[] = [],
  cardSources: string[] = [],
  ownerTransfers: OwnerTransfer[] = [],
  displayCurrency: "USD" | "EUR" = "USD",
  baseCurrency: "USD" = "USD",
  fxAsOf?: string,
): ExpandedPayload {
  return {
    expenses,
    income,
    debts,
    debtPayments,
    ownerTransfers,
    presetTransactions,
    expenseCategoriesWithColors,
    incomeCategoriesWithColors,
    owners,
    cardSources,
    displayCurrency,
    baseCurrency,
    fxAsOf,
  };
}

export function downloadBudgetJson(payload: ExpandedPayload): void {
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `budget-tool-export-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function parseBudgetJson(text: string): ExpandedPayload {
  const raw = JSON.parse(text) as Partial<ExpandedPayload>;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid JSON export");
  }
  return {
    expenses: Array.isArray(raw.expenses) ? raw.expenses : [],
    income: Array.isArray(raw.income) ? raw.income : [],
    debts: Array.isArray(raw.debts) ? raw.debts : [],
    debtPayments: Array.isArray(raw.debtPayments) ? raw.debtPayments : [],
    ownerTransfers: Array.isArray(raw.ownerTransfers) ? raw.ownerTransfers : [],
    presetTransactions: Array.isArray(raw.presetTransactions)
      ? raw.presetTransactions
      : [],
    expenseCategoriesWithColors: Array.isArray(raw.expenseCategoriesWithColors)
      ? raw.expenseCategoriesWithColors
      : [],
    incomeCategoriesWithColors: Array.isArray(raw.incomeCategoriesWithColors)
      ? raw.incomeCategoriesWithColors
      : [],
    owners: Array.isArray(raw.owners) ? raw.owners : [],
    cardSources: Array.isArray(raw.cardSources) ? raw.cardSources : [],
    displayCurrency: raw.displayCurrency === "EUR" ? "EUR" : "USD",
    baseCurrency: "USD",
    fxAsOf: typeof raw.fxAsOf === "string" ? raw.fxAsOf : undefined,
  };
}
