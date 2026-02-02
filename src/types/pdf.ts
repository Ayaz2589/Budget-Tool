import type { Debt, DebtPayment, Expense, Income, PresetTransaction } from "./core";
import type { Rule } from "./rules";
import type { CategoryWithColorPayload } from "./payload";

export interface ParsedExportedPdf {
  expenses: Expense[];
  income: Income[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  rules: Rule[];
  presetTransactions: PresetTransaction[];
  expenseCategoriesWithColors?: CategoryWithColorPayload[];
  incomeCategoriesWithColors?: CategoryWithColorPayload[];
  cardSources?: string[];
}
