import type {
  Debt,
  DebtPayment,
  Expense,
  Income,
  PresetTransaction,
} from "./core";

/** Category name + color for payload (used in PDF and Sheets). */
export interface CategoryWithColorPayload {
  name: string;
  color: string;
}

export interface MinifiedPayloadInput {
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

export interface ExpandedPayload {
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
