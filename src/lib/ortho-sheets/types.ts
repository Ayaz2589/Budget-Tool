/**
 * Ortho domain entity types.
 * Moved from src/lib/sheets-db/types.ts — zero changes to field shapes.
 */

export type ExpenseSource =
  | "amex"
  | "amex-gold"
  | "apple"
  | "visa"
  | "sapphire"
  | "bank-of-america"
  | "wells-fargo"
  | "chase"
  | "manual"
  | "td";

export const ALL_EXPENSE_SOURCES: ExpenseSource[] = [
  "amex",
  "amex-gold",
  "apple",
  "visa",
  "sapphire",
  "bank-of-america",
  "wells-fargo",
  "chase",
  "manual",
  "td",
];

export interface ExpenseAllocation {
  owner: string;
  amount?: number;
  percent?: number;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  source: ExpenseSource;
  owner?: string;
  paidByOwner?: string;
  allocationMode?: "single" | "equal" | "custom";
  allocation?: ExpenseAllocation[];
}

export interface Income {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  owner?: string;
}

export interface Debt {
  id: string;
  name: string;
  initialAmount: number;
  startDate?: string;
  owner?: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  date: string;
  amount: number;
  note?: string;
}

export interface OwnerTransfer {
  id: string;
  date: string;
  fromOwner: string;
  toOwner: string;
  amount: number;
  note?: string;
}

export interface PresetTransaction {
  id: string;
  source: ExpenseSource;
  description: string;
  amount?: number;
  category: string;
  owner: string;
}

export interface MonthTotals {
  monthKey: string;
  monthLabel: string;
  totalEarned: number;
  totalSpent: number;
  totalSpentWithoutMortgage: number;
  sharedSpent: number;
  sharedSplit: Record<string, number>;
  ownerSpending: Record<string, number>;
  ownerBalances: Record<string, number>;
  totalSaved: number;
  personalSavingsRate: number;
  hysa: number;
  investingSp500: number;
  investingTotal: number;
}

export interface SheetIds {
  expenses: number;
  income: number;
  totals: number;
  debts: number;
  debtPayments: number;
  mortgage: number;
  presetTransactions: number;
  ownerTransfers: number;
}

export interface SyncPayload {
  expenses: Expense[];
  mortgageExpenses: Expense[];
  income: Income[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  ownerTransfers: OwnerTransfer[];
  presetTransactions: PresetTransaction[];
  months: MonthTotals[];
  grandTotal: MonthTotals;
  dataBlob: string;
}
