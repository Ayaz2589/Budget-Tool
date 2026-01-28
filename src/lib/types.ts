export type ExpenseSource =
  | "amex"
  | "chase"
  | "apple"
  | "manual"
  | "td";

export interface Expense {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  amount: number;
  description: string;
  category: string;
  source: ExpenseSource;
  cardMember?: string; // raw from CSV e.g. "AYAZ UDDIN" | "TASNUVA AHMED"
}

export interface Income {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  amount: number;
  description: string;
  category: string;
}

export interface ParseResult {
  expenses: Expense[];
  source: ExpenseSource;
}

export const DEFAULT_EXPENSE_CATEGORIES = [
  "My Purchase",
  "Tasnuva's Purchases",
  "50/50",
  "Mortgage",
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  "Rent",
  "Paycheck",
  "Bonus",
  "Other",
] as const;

export type ExpenseCategory = (typeof DEFAULT_EXPENSE_CATEGORIES)[number];
export type IncomeCategory = (typeof DEFAULT_INCOME_CATEGORIES)[number];
