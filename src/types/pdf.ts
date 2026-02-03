import type { Debt, DebtPayment, Expense, Income, PresetTransaction } from "./core";
import type { CategoryWithColorPayload } from "./payload";

export interface ParsedExportedPdf {
  expenses: Expense[];
  income: Income[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  presetTransactions: PresetTransaction[];
  expenseCategoriesWithColors?: CategoryWithColorPayload[];
  incomeCategoriesWithColors?: CategoryWithColorPayload[];
  owners?: string[];
  cardSources?: string[];
}
