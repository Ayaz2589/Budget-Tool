import type { Income } from "@/lib/types";

export const PAYCHECK_AMOUNT = 4178.4;
export const PAYCHECK_DESCRIPTION = "Paycheck";
export const PAYCHECK_CATEGORY = "Paycheck";

/** Rent: two entries on the 5th of each month. */
export const RENT_AMOUNTS = [2200, 2800] as const;
export const RENT_DESCRIPTION = "Rent";
export const RENT_CATEGORY = "Rent";

const AMOUNT_TOLERANCE = 0.01;

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

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

export function isRentEntry(i: Income): boolean {
  const isRentDesc =
    (i.description || "").toLowerCase() === RENT_DESCRIPTION.toLowerCase();
  const isRentCat =
    (i.category || "").toLowerCase() === RENT_CATEGORY.toLowerCase();
  const amountMatch = RENT_AMOUNTS.some(
    (a) => Math.abs(i.amount - a) < AMOUNT_TOLERANCE,
  );
  return (isRentDesc || isRentCat) && amountMatch;
}

export function hasRentOnSheet(income: Income[]): boolean {
  return income.some(isRentEntry);
}

/** Current month (UTC) rent date: 5th. */
export function getCurrentMonthRentDateUTC(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const monthStr = month.toString().padStart(2, "0");
  return `${year}-${monthStr}-05`;
}

/** Auto-added income rules (shown in rules section, read-only). */
export const AUTO_INCOME_RULES_READONLY: { schedule: string; amount: string; category: string }[] = [
  { schedule: "15th of each month", amount: formatCurrency(PAYCHECK_AMOUNT), category: PAYCHECK_CATEGORY },
  { schedule: "31st of each month (if applicable)", amount: formatCurrency(PAYCHECK_AMOUNT), category: PAYCHECK_CATEGORY },
  { schedule: "5th of each month", amount: formatCurrency(RENT_AMOUNTS[0]), category: RENT_CATEGORY },
  { schedule: "5th of each month", amount: formatCurrency(RENT_AMOUNTS[1]), category: RENT_CATEGORY },
];

/** Auto-added expense rules (shown in rules section, read-only). */
export const AUTO_EXPENSE_RULES_READONLY: { schedule: string; amount: string; category: string }[] = [];
