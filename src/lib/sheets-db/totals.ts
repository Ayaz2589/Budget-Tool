/**
 * Totals repository for the sheets database layer (write-only).
 */

import type { MonthTotals } from "./types";
import type { TransportContext } from "./transport";
import { clearRange, updateSheet } from "./transport";
import { SHEET_WRITE_RANGES } from "./schema";

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

export function buildTotalsValues(months: MonthTotals[], grandTotal: MonthTotals): unknown[][] {
  const headers = buildTotalsHeaders(grandTotal);
  return [
    headers,
    ...months.map((m) => buildTotalsRow(m)),
    buildTotalsRow(grandTotal),
  ];
}

export async function writeTotals(
  ctx: TransportContext,
  months: MonthTotals[],
  grandTotal: MonthTotals,
): Promise<void> {
  const rows = buildTotalsValues(months, grandTotal);
  const range = SHEET_WRITE_RANGES.totals;
  await clearRange(ctx, range);
  await updateSheet(ctx, range, rows, false);
}
