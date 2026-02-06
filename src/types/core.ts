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

/** All possible expense/card sources; used for defaults and settings. */
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

export interface Expense {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  amount: number;
  description: string;
  category: string;
  source: ExpenseSource;
  owner?: string; // optional owner label (from settings)
}

export interface Income {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  amount: number;
  description: string;
  category: string;
  /** Owner label from settings */
  owner?: Owner;
}

export type Owner = string;

export interface Debt {
  id: string;
  name: string;
  initialAmount: number;
  startDate?: string; // ISO date YYYY-MM-DD
  owner?: Owner;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  date: string; // ISO date YYYY-MM-DD
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

export interface ParseResult {
  expenses: Expense[];
  source: ExpenseSource;
}

export const DEFAULT_EXPENSE_CATEGORIES = [
  "My Purchase",
  "Tasnuva's Purchases",
  "50/50",
  "Amazon",
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  "Rent",
  "Paycheck",
  "Bonus",
  "Other",
] as const;

export type ExpenseCategory = (typeof DEFAULT_EXPENSE_CATEGORIES)[number];
export type IncomeCategory = (typeof DEFAULT_INCOME_CATEGORIES)[number];
