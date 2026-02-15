import type { Expense, Income } from "@/types/core";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** ISO date pattern: YYYY-MM-DD */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Returns true if the string is a valid ISO date (YYYY-MM-DD) that represents
 * a real calendar date.
 */
function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const d = new Date(value + "T00:00:00");
  if (Number.isNaN(d.getTime())) return false;
  // Verify round-trip: the Date should produce the same YYYY-MM-DD
  const [y, m, day] = value.split("-");
  return (
    d.getFullYear() === Number(y) &&
    d.getMonth() + 1 === Number(m) &&
    d.getDate() === Number(day)
  );
}

/**
 * Validate a partial Expense object. Returns errors for invalid data and
 * warnings for things that are technically allowed but suspicious.
 */
export function validateExpense(expense: Partial<Expense>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Amount validation
  if (expense.amount === undefined || expense.amount === null) {
    errors.push("amount is required");
  } else if (!Number.isFinite(expense.amount)) {
    errors.push("amount must be a finite number");
  } else if (expense.amount <= 0) {
    errors.push("amount must be greater than 0");
  }

  // Date validation
  if (!expense.date) {
    errors.push("date is required");
  } else if (!isValidIsoDate(expense.date)) {
    errors.push("date must be a valid ISO date string (YYYY-MM-DD)");
  }

  // Description warning
  if (!expense.description || expense.description.trim() === "") {
    warnings.push("description should not be empty");
  }

  // Allocation validation
  if (expense.allocation && expense.allocation.length > 0) {
    const totalPercent = expense.allocation.reduce(
      (sum, a) => sum + (a.percent ?? 0),
      0
    );
    // Allow a small tolerance for floating-point arithmetic
    if (Math.abs(totalPercent - 100) > 0.5) {
      errors.push(
        `allocation percentages must sum to approximately 100 (got ${totalPercent.toFixed(1)})`
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate a partial Income object. Returns errors for invalid data and
 * warnings for things that are technically allowed but suspicious.
 */
export function validateIncome(entry: Partial<Income>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Amount validation
  if (entry.amount === undefined || entry.amount === null) {
    errors.push("amount is required");
  } else if (!Number.isFinite(entry.amount)) {
    errors.push("amount must be a finite number");
  } else if (entry.amount <= 0) {
    errors.push("amount must be greater than 0");
  }

  // Date validation
  if (!entry.date) {
    errors.push("date is required");
  } else if (!isValidIsoDate(entry.date)) {
    errors.push("date must be a valid ISO date string (YYYY-MM-DD)");
  }

  // Description warning
  if (!entry.description || entry.description.trim() === "") {
    warnings.push("description should not be empty");
  }

  return { valid: errors.length === 0, errors, warnings };
}
