/**
 * Validation helpers for data read from Google Sheets.
 */

import type { ExpenseSource } from "@/types/core";
import { ALL_EXPENSE_SOURCES } from "@/types/core";

/** Validate that a raw source string is a known ExpenseSource; falls back to "manual". */
export function validateExpenseSource(rawSource: string): ExpenseSource {
  const lower = rawSource.trim().toLowerCase();
  return ALL_EXPENSE_SOURCES.includes(lower as ExpenseSource)
    ? (lower as ExpenseSource)
    : "manual";
}

/**
 * Determine whether the first column of a row is an ID column (not a date).
 * Legacy rows start with a date; modern rows have an ID prefix.
 */
export function hasIdColumn(row: unknown[], minLength: number, looksLikeDate: (v: string) => boolean): boolean {
  const first = String(row[0] ?? "").trim();
  return row.length >= minLength && first.length > 0 && !looksLikeDate(first);
}

/** Validate that required headers are present (case-insensitive). Returns missing header names. */
export function findMissingHeaders(
  actualHeaders: string[],
  requiredHeaders: string[],
): string[] {
  const normalized = new Set(actualHeaders.map((h) => h.trim().toLowerCase()));
  return requiredHeaders.filter((h) => !normalized.has(h.toLowerCase()));
}
