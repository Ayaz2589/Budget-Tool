/**
 * Ortho-specific formatting rules for each sheet schema.
 * Defines currency columns, percent columns, and alignment.
 */

import type { FormattingRule } from "@/lib/sheets-db";

const CURRENCY = { type: "CURRENCY", pattern: "$#,##0.00" } as const;
const PERCENT = { type: "PERCENT", pattern: "0.0%" } as const;

// Expenses & Mortgage (7 cols): amount col 2-3
export const EXPENSE_FORMATTING: FormattingRule[] = [
  { startCol: 0, endCol: 7, horizontalAlignment: "LEFT" },
  { startCol: 2, endCol: 3, horizontalAlignment: "LEFT", numberFormat: CURRENCY },
];

export const MORTGAGE_FORMATTING = EXPENSE_FORMATTING;

// Income (9 cols): amount col 1-2
export const INCOME_FORMATTING: FormattingRule[] = [
  { startCol: 0, endCol: 9, horizontalAlignment: "LEFT" },
  { startCol: 1, endCol: 2, horizontalAlignment: "LEFT", numberFormat: CURRENCY },
];

// Debts (9 cols): amount cols 2-3 and 5-6
export const DEBT_FORMATTING: FormattingRule[] = [
  { startCol: 0, endCol: 9, horizontalAlignment: "LEFT" },
  { startCol: 2, endCol: 3, horizontalAlignment: "LEFT", numberFormat: CURRENCY },
  { startCol: 5, endCol: 6, horizontalAlignment: "LEFT", numberFormat: CURRENCY },
];

// DebtPayments (5 cols): amount col 3-4
export const DEBT_PAYMENT_FORMATTING: FormattingRule[] = [
  { startCol: 0, endCol: 5, horizontalAlignment: "LEFT" },
  { startCol: 3, endCol: 4, horizontalAlignment: "LEFT", numberFormat: CURRENCY },
];

// OwnerTransfers (6 cols): amount col 4-5
export const OWNER_TRANSFER_FORMATTING: FormattingRule[] = [
  { startCol: 0, endCol: 6, horizontalAlignment: "LEFT" },
  { startCol: 4, endCol: 5, horizontalAlignment: "LEFT", numberFormat: CURRENCY },
];

// Totals (15 cols): cols 1-14 currency except col 11 which is percent
export const TOTALS_FORMATTING: FormattingRule[] = [
  { startCol: 0, endCol: 15, horizontalAlignment: "LEFT", endRow: 100 },
  // Currency for cols 1-10
  ...Array.from({ length: 10 }, (_, i) => ({
    startCol: i + 1,
    endCol: i + 2,
    horizontalAlignment: "LEFT" as const,
    numberFormat: CURRENCY,
    endRow: 100,
  })),
  // Percent for col 11
  { startCol: 11, endCol: 12, horizontalAlignment: "LEFT", numberFormat: PERCENT, endRow: 100 },
  // Currency for cols 12-14
  ...Array.from({ length: 3 }, (_, i) => ({
    startCol: i + 12,
    endCol: i + 13,
    horizontalAlignment: "LEFT" as const,
    numberFormat: CURRENCY,
    endRow: 100,
  })),
];

// PresetTransactions (5 cols): no special number formatting
export const PRESET_FORMATTING: FormattingRule[] = [
  { startCol: 0, endCol: 5, horizontalAlignment: "LEFT" },
];

/** Standard header formatting used by all Ortho schemas. */
export const ORTHO_HEADER_FORMAT = {
  bold: true,
  fontSize: 12,
  horizontalAlignment: "LEFT" as const,
};
