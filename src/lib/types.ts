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

export type DebtOwner = "Ayaz" | "Tasnuva";

export interface Debt {
  id: string;
  name: string;
  initialAmount: number;
  startDate?: string; // ISO date YYYY-MM-DD
  owner?: DebtOwner; // default "Ayaz" when missing (backward compat)
  /** Recurring payment amount */
  recurringAmount?: number;
  /** "monthly" = each month on recurringDayOfMonth; "biweekly" = every 14 days from recurringStartDate */
  recurringFrequency?: "monthly" | "biweekly";
  /** Day of month (1–31) when recurring payment is applied (monthly only) */
  recurringDayOfMonth?: number;
  /** First payment date for bi-weekly schedule (YYYY-MM-DD) */
  recurringStartDate?: string;
}

export interface DebtPayment {
  id: string;
  debtId: string;
  date: string; // ISO date YYYY-MM-DD
  amount: number;
  note?: string;
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
