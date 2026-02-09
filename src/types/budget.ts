import type {
  Debt,
  DebtPayment,
  Expense,
  Income,
  OwnerTransfer,
} from "./core";

export interface BudgetState {
  expenses: Expense[];
  income: Income[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  ownerTransfers: OwnerTransfer[];
  expenseCategories: string[];
  incomeCategories: string[];
  owners: string[];
  /** Enabled card/expense sources; used in transaction table and import. */
  cardSources: string[];
}
