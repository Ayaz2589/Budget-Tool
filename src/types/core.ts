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
  /** Preferred payer field for new records. Falls back to legacy `owner`. */
  paidByOwner?: string;
  allocationMode?: "single" | "equal" | "custom";
  allocation?: ExpenseAllocation[];
}

export interface ExpenseAllocation {
  owner: string;
  amount?: number;
  percent?: number;
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

export type LedgerEntryType = "expense" | "owner-transfer";

export interface OwnerTransfer {
  id: string;
  date: string; // ISO date YYYY-MM-DD
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

export interface ParseResult {
  expenses: Expense[];
  source: ExpenseSource;
  error?: string;
}

/**
 * @deprecated Use `getAllCompositeKeys("expense")` from `@/lib/categories` instead.
 * Kept temporarily for backward compatibility during migration.
 */
export const DEFAULT_EXPENSE_CATEGORIES = [] as const;

/**
 * @deprecated Use `getAllCompositeKeys("income")` from `@/lib/categories` instead.
 * Kept temporarily for backward compatibility during migration.
 */
export const DEFAULT_INCOME_CATEGORIES = [] as const;

/** @deprecated Categories are now preset composite keys from the registry. */
export type ExpenseCategory = string;
/** @deprecated Categories are now preset composite keys from the registry. */
export type IncomeCategory = string;
