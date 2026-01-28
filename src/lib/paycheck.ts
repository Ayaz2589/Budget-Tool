import type { Income } from "@/lib/types";

export const PAYCHECK_AMOUNT = 4178.4;
export const PAYCHECK_DESCRIPTION = "Paycheck";
export const PAYCHECK_CATEGORY = "Paycheck";

const AMOUNT_TOLERANCE = 0.01;

/** Months that have 31 days (1-indexed). */
const MONTHS_WITH_31 = new Set([1, 3, 5, 7, 8, 10, 12]);

export function isPaycheckEntry(i: Income): boolean {
  const amountMatch = Math.abs(i.amount - PAYCHECK_AMOUNT) < AMOUNT_TOLERANCE;
  const descMatch =
    (i.description || "").toLowerCase() === PAYCHECK_DESCRIPTION.toLowerCase();
  const catMatch =
    (i.category || "").toLowerCase() === PAYCHECK_CATEGORY.toLowerCase();
  return amountMatch && (descMatch || catMatch);
}

export function hasPaycheckOnSheet(income: Income[]): boolean {
  return income.some(isPaycheckEntry);
}

/** Current month (UTC) paycheck dates: 15th and 31st (if month has 31 days). */
export function getCurrentMonthPaycheckDatesUTC(): string[] {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1; // 1-indexed
  const monthStr = month.toString().padStart(2, "0");
  const dates = [`${year}-${monthStr}-15`];
  if (MONTHS_WITH_31.has(month)) {
    dates.push(`${year}-${monthStr}-31`);
  }
  return dates;
}

export function getPaycheckDatesForYear(year: number): string[] {
  const dates: string[] = [];
  for (let month = 1; month <= 12; month++) {
    const monthStr = month.toString().padStart(2, "0");
    dates.push(`${year}-${monthStr}-15`);
    if (MONTHS_WITH_31.has(month)) {
      dates.push(`${year}-${monthStr}-31`);
    }
  }
  return dates;
}
