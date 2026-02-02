import type { Debt, DebtPayment, Expense, Income } from "./core";

export interface BudgetState {
  expenses: Expense[];
  income: Income[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  expenseCategories: string[];
  incomeCategories: string[];
  /** Enabled card/expense sources; used in transaction table and import. */
  cardSources: string[];
}
