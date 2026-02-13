import type { Expense } from "@/lib/types";
import { amountsWithinTolerance } from "@/lib/math";

const AMOUNT_TOLERANCE = 0.01;

/**
 * Returns true if two expenses represent the same transaction.
 * Matches on date, amount (with tolerance), and owner when both have it (for Amex/Apple).
 */
export function isSameExpense(a: Expense, b: Expense): boolean {
  if (a.date !== b.date) return false;
  if (!amountsWithinTolerance(a.amount, b.amount, AMOUNT_TOLERANCE)) return false;

  const ownerA = (a.owner || "").trim().toLowerCase();
  const ownerB = (b.owner || "").trim().toLowerCase();
  if (ownerA && ownerB && ownerA !== ownerB) return false;

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
