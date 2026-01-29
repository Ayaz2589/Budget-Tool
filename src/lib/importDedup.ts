import type { Expense } from "@/lib/types";

const AMOUNT_TOLERANCE = 0.01;

/**
 * Returns true if two expenses represent the same transaction.
 * Matches on date, amount (with tolerance), description (case-insensitive),
 * and cardMember when both have it (for Amex/Apple).
 */
export function isSameExpense(a: Expense, b: Expense): boolean {
  if (a.date !== b.date) return false;
  if (Math.abs(a.amount - b.amount) >= AMOUNT_TOLERANCE) return false;

  const descA = (a.description || "").trim().toLowerCase();
  const descB = (b.description || "").trim().toLowerCase();
  if (descA !== descB) return false;

  const cardA = (a.cardMember || "").trim().toLowerCase();
  const cardB = (b.cardMember || "").trim().toLowerCase();
  if (cardA && cardB && cardA !== cardB) return false;

  return true;
}

/**
 * Filters out parsed expenses that already exist in the budget.
 * Use before adding CSV or PDF imports to avoid duplicates with manual entries.
 */
export function filterOutExistingExpenses(
  parsed: Expense[],
  existing: Expense[]
): Expense[] {
  return parsed.filter((p) => {
    const alreadyExists = existing.some((e) => isSameExpense(p, e));
    return !alreadyExists;
  });
}
