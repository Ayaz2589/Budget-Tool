/**
 * Write operations for the Totals summary sheet.
 */

import type { MonthTotals } from "@/types/totals";
import type { SheetsClient } from "./client";

/** Build the dynamic header row from a MonthTotals (uses owner keys for dynamic columns). */
function buildTotalsHeaders(m: MonthTotals): string[] {
  const ownerKeys = Object.keys(m.ownerSpending).sort();
  return [
    "Month",
    "Total Earned",
    "Total Spent",
    "Total Spent w/o Mortgage",
    "Shared Spent",
    ...ownerKeys.map((k) => `${k}'s Spending`),
    ...ownerKeys.map((k) => `${k}'s Balance`),
    "Total Saved",
    "Personal Savings Rate",
    "HYSA",
    "Investing (S&P 500)",
    "Investing Total",
  ];
}

/** Build one data row from a MonthTotals record. */
function buildTotalsRow(m: MonthTotals): unknown[] {
  const ownerKeys = Object.keys(m.ownerSpending).sort();
  return [
    m.monthLabel,
    m.totalEarned,
    m.totalSpent,
    m.totalSpentWithoutMortgage,
    m.sharedSpent,
    ...ownerKeys.map((k) => m.ownerSpending[k] ?? 0),
    ...ownerKeys.map((k) => m.ownerBalances[k] ?? 0),
    m.totalSaved,
    m.personalSavingsRate,
    m.hysa,
    m.investingSp500,
    m.investingTotal,
  ];
}

/** Build the full header + data rows array for the Totals sheet (used by batch sync). */
export function buildTotalsValues(months: MonthTotals[], grandTotal: MonthTotals): unknown[][] {
  const headers = buildTotalsHeaders(grandTotal);
  return [
    headers,
    ...months.map((m) => buildTotalsRow(m)),
    buildTotalsRow(grandTotal),
  ];
}

/** Convert a 0-based column index to a spreadsheet column letter (0→A, 25→Z, 26→AA). */
function colLetter(index: number): string {
  let result = "";
  let n = index;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

/** Clear and rewrite the Totals sheet with monthly summaries and a grand total row. */
export async function writeTotalsSheet(
  db: SheetsClient,
  months: MonthTotals[],
  grandTotal: MonthTotals,
): Promise<void> {
  const rows = buildTotalsValues(months, grandTotal);
  const numCols = rows[0]?.length ?? 1;
  const numRows = rows.length;
  const endCol = colLetter(numCols - 1);
  const range = `Totals!A1:${endCol}${numRows}`;
  await db.raw.clearRange(range);
  await db.raw.writeRange(range, rows);
}
