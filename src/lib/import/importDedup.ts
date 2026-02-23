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
 * Round an amount to the nearest cent (2 decimal places).
 */
function roundToCents(amount: number): string {
  return (Math.round(amount * 100) / 100).toFixed(2);
}

/**
 * Build a key for the dedup index. Uses date and rounded amount.
 * Owner is stored separately to support wildcard matching.
 */
function dedupKey(date: string, roundedAmount: string): string {
  return `${date}|${roundedAmount}`;
}

/**
 * Build a dedup index from existing expenses for O(1) lookups.
 * Maps date|roundedAmount -> array of normalized owners.
 */
function buildExistingIndex(existing: Expense[]): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const e of existing) {
    const key = dedupKey(e.date, roundToCents(e.amount));
    let owners = index.get(key);
    if (!owners) {
      owners = [];
      index.set(key, owners);
    }
    owners.push((e.owner || "").trim().toLowerCase());
  }
  return index;
}

/**
 * Check if a parsed expense matches any existing expense in the index.
 * Checks the exact rounded amount and +/- 1 cent to handle tolerance edge cases.
 */
function existsInIndex(
  parsed: Expense,
  index: Map<string, string[]>
): boolean {
  const parsedOwner = (parsed.owner || "").trim().toLowerCase();
  const amountCents = Math.round(parsed.amount * 100);

  // Check exact rounded amount and +/- 1 cent to handle tolerance boundary
  const candidates = [amountCents - 1, amountCents, amountCents + 1];

  for (const cents of candidates) {
    const rounded = (cents / 100).toFixed(2);
    const key = dedupKey(parsed.date, rounded);
    const owners = index.get(key);
    if (!owners) continue;

    for (const existingOwner of owners) {
      // If either owner is empty, it's a wildcard match
      if (!parsedOwner || !existingOwner || parsedOwner === existingOwner) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Filters out parsed expenses that already exist in the budget.
 * Use before adding CSV or PDF imports to avoid duplicates with manual entries.
 *
 * Uses an indexed lookup (O(n + m)) instead of O(n * m) nested iteration.
 */
export function filterOutExistingExpenses(
  parsed: Expense[],
  existing: Expense[]
): Expense[] {
  const index = buildExistingIndex(existing);
  return parsed.filter((p) => !existsInIndex(p, index));
}
