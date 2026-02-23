/**
 * Write operations for the Totals summary sheet.
 */

import type { MonthTotals } from "@/types/totals";
import { clearRange, updateSheet, DATA_RANGES } from "./transport";

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

/** Clear and rewrite the Totals sheet with monthly summaries and a grand total row. */
export async function writeTotalsSheet(
  accessToken: string,
  spreadsheetId: string,
  months: MonthTotals[],
  grandTotal: MonthTotals,
): Promise<void> {
  const rows = buildTotalsValues(months, grandTotal);
  const range = DATA_RANGES.totalsWrite;
  await clearRange(accessToken, spreadsheetId, range);
  await updateSheet(accessToken, spreadsheetId, range, rows);
}
