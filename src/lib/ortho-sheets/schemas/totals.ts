/**
 * Totals schema definition (write-only).
 */

import type { SheetSchema } from "@/lib/sheets-db";
import type { MonthTotals } from "../types";
import { TOTALS_FORMATTING, ORTHO_HEADER_FORMAT } from "../formatting";

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

export { buildTotalsHeaders, buildTotalsRow };

export const totalsSchema: SheetSchema<MonthTotals> = {
  sheetName: "Totals",
  headers: ["Month", "Total Earned", "Total Spent"],
  readRange: "Totals!A2:Z",
  writeRange: "Totals!A1:Z100",
  clearRange: "Totals!A1:O1000",
  appendSupported: false,

  parseRow(_row) {
    // Totals is write-only — read is not used
    return null;
  },

  toRow(m) {
    return buildTotalsRow(m);
  },
  formatting: TOTALS_FORMATTING,
  headerFormatting: ORTHO_HEADER_FORMAT,
};
